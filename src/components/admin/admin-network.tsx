"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ArrowUpRight,
  Banknote,
  HeartHandshake,
  Layers,
  Leaf,
  List,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import { filterNetwork, hasMapLocation, type NetworkOrganization } from "@/lib/admin-network";
import { money, number } from "@/lib/domain";
import { PagedItems } from "../screen-sections";
import styles from "./network.module.css";

const NetworkMap = dynamic(() => import("./network-map"), {
  ssr: false,
  loading: () => <span className={styles.mapLoading}>Preparando o mapa da rede…</span>,
});

function OrganizationCard({ org, close }: { org: NetworkOrganization; close: () => void }) {
  const [tab, setTab] = useState<"impact" | "about">("impact");
  const [failedPhoto, setFailedPhoto] = useState(false);
  const fallback = `/organizations/${org.type === "NGO" ? "ngo" : "market"}-illustrative.webp`;
  const photo = failedPhoto ? fallback : org.photo.url;
  const card = useRef<HTMLElement>(null);
  const isMarket = org.type === "SUPERMARKET";
  useEffect(() => {
    card.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.orgCard}
      ref={card}
      tabIndex={-1}
      aria-label={`Detalhes de ${org.name}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div className={styles.cardPhoto}>
        <Image
          src={photo}
          alt={
            failedPhoto || !org.photo.source
              ? "Imagem ilustrativa de organização da rede"
              : org.photo.label
          }
          fill
          loading="eager"
          unoptimized
          sizes="320px"
          onError={() => setFailedPhoto(true)}
        />
        <span>
          {isMarket ? <Store size={12} /> : <HeartHandshake size={12} />}
          {isMarket ? "Supermercado" : "Instituição"}
        </span>
        <button type="button" aria-label="Fechar detalhes" onClick={close}>
          <X size={17} />
        </button>
      </div>
      <div className={styles.cardBody}>
        <div>
          <h2>{org.name}</h2>
          <p className={styles.cardNeighborhood}>
            <MapPin size={12} />
            {org.neighborhood} · {org.city}
          </p>
        </div>
        <div className={styles.cardTabs} role="group" aria-label="Informações da organização">
          <button type="button" aria-pressed={tab === "impact"} onClick={() => setTab("impact")}>
            Na plataforma
          </button>
          <button type="button" aria-pressed={tab === "about"} onClick={() => setTab("about")}>
            Sobre o local
          </button>
        </div>
        {tab === "impact" ? (
          <>
            <div className={styles.cardMetrics}>
              <div>
                <strong>
                  {number(org.kg)}
                  <small> kg</small>
                </strong>
                <span>{isMarket ? "Alimentos doados" : "Alimentos recebidos"}</span>
              </div>
              <div>
                <strong>{number(org.delivered)}</strong>
                <span>{isMarket ? "Doações entregues" : "Doações recebidas"}</span>
              </div>
            </div>
            {isMarket ? (
              <div className={styles.savings}>
                <span>
                  <Banknote size={14} /> Economia com aterro · estimada
                </span>
                <strong>{money(org.savings)}</strong>
              </div>
            ) : (
              <div className={styles.meals}>
                <Leaf size={17} />
                <span>
                  <strong>{number(org.meals)}</strong> refeições estimadas
                </span>
              </div>
            )}
            <div className={styles.cardFootnote}>
              {isMarket
                ? `${org.published} lotes publicados · ${org.available} disponíveis`
                : `${org.ongoing} resgates em andamento`}
            </div>
          </>
        ) : (
          <div className={styles.about}>
            <p>
              <MapPin size={14} />
              <span>
                {org.address_line}
                <br />
                {org.neighborhood}, {org.city}
              </span>
            </p>
            <p>
              {failedPhoto || !org.photo.source
                ? "Imagem ilustrativa gerada para a apresentação."
                : org.photo.label}
            </p>
            {org.photo.source && !failedPhoto && (
              <a href={org.photo.source} target="_blank" rel="noreferrer">
                Fonte institucional <ArrowUpRight size={14} />
              </a>
            )}
            <p>
              Indicadores de entregas confirmadas no ONGSave.{" "}
              {isMarket
                ? "Cenário demonstrativo de descarte: R$ 7,72/kg, conforme o cálculo atual da plataforma. Não é uma tarifa de aterro contratada."
                : "Estimativa de 2 refeições por kg recebido."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function AdminNetwork({ organizations }: { organizations: NetworkOrganization[] }) {
  const [type, setType] = useState<"ALL" | "NGO" | "SUPERMARKET">("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelected] = useState<string>();
  const [view, setView] = useState<"map" | "list">("map");
  const [resetKey, setReset] = useState(0);
  const filtered = useMemo(
    () => filterNetwork(organizations, type, query),
    [organizations, type, query],
  );
  const selected = filtered.find((org) => org.id === selectedId);
  const ngos = organizations.filter((org) => org.type === "NGO");
  const markets = organizations.filter((org) => org.type === "SUPERMARKET");
  const kg = markets.reduce((s, org) => s + org.kg, 0);
  const savings = markets.reduce((s, org) => s + org.savings, 0);
  const missingLocations = filtered.filter((org) => !hasMapLocation(org)).length;
  const close = () => {
    const id = selected?.id;
    setSelected(undefined);
    requestAnimationFrame(() => {
      const trigger = [
        ...document.querySelectorAll<HTMLButtonElement>("button[data-organization]"),
      ].find(
        (button) => button.dataset.organization === id && button.getBoundingClientRect().width > 0,
      );
      trigger?.focus({ preventScroll: true });
    });
  };
  function changeFilter(next: typeof type) {
    setType(next);
    setSelected(undefined);
  }
  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Conexões que alimentam</span>
          <h1>Uma rede. Muitos destinos.</h1>
        </div>
        <span className={styles.adminBadge}>
          <ShieldCheck size={14} /> Administração
        </span>
      </div>
      <div className={styles.stats} aria-label="Resumo da rede">
        {[
          { value: number(ngos.length), label: "ONGs na rede", Icon: HeartHandshake },
          { value: number(markets.length), label: "Supermercados", Icon: Store },
          { value: `${number(kg)} kg`, label: "Alimentos entregues", Icon: Leaf },
          { value: money(savings), label: "Descarte evitado · estimado", Icon: Banknote },
        ].map(({ value, label, Icon }) => (
          <div key={label}>
            <Icon size={18} />
            <span>
              <strong>{value}</strong>
              <small>{label}</small>
            </span>
          </div>
        ))}
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={17} />
          <input
            aria-label="Buscar organização"
            placeholder="Busque nome ou bairro…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(undefined);
            }}
          />
        </label>
        <div className={styles.filters} role="group" aria-label="Filtrar organizações">
          {(
            [
              { id: "ALL", label: "Toda a rede" },
              { id: "NGO", label: "ONGs" },
              { id: "SUPERMARKET", label: "Mercados" },
            ] as const
          ).map((filter) => (
            <button
              type="button"
              key={filter.id}
              aria-pressed={type === filter.id}
              onClick={() => changeFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className={styles.viewToggle} role="group" aria-label="Modo de visualização">
          <button
            type="button"
            aria-label="Ver mapa"
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            <Map size={17} />
          </button>
          <button
            type="button"
            aria-label="Ver lista"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      <div className={styles.workspace}>
        <div className={styles.mapView} hidden={view !== "map"}>
          <NetworkMap
            organizations={filtered}
            selectedId={selected?.id}
            onSelect={setSelected}
            resetKey={resetKey}
          />
          <button
            type="button"
            className={styles.fitButton}
            onClick={() => {
              setSelected(undefined);
              setReset((key) => key + 1);
            }}
          >
            <Layers size={15} /> Enquadrar rede
          </button>
          <div className={styles.legend}>
            <span>
              <i className={styles.ngoDot} /> ONG
            </span>
            <span>
              <i className={styles.marketDot} /> Supermercado
            </span>
            <span role="status">
              {filtered.length - missingLocations}{" "}
              {filtered.length - missingLocations === 1 ? "ponto" : "pontos"}
            </span>
          </div>
        </div>
        <div className={styles.listView} hidden={view !== "list"}>
          <div className={styles.listHeading}>
            <h2>Organizações da rede</h2>
            <span className="small muted" role="status">
              {filtered.length} resultados
            </span>
          </div>
          <PagedItems
            key={`${type}:${query}`}
            className={styles.directory}
            pageSize={4}
            mobilePageSize={2}
            label="Organizações"
          >
            {filtered.map((org) => (
              <button
                type="button"
                key={org.id}
                data-organization={org.id}
                className={styles.directoryItem}
                aria-label={`Ver ${org.name}`}
                onClick={() => setSelected(org.id)}
              >
                <span className={org.type === "NGO" ? styles.ngoSymbol : styles.marketSymbol}>
                  {org.type === "NGO" ? <HeartHandshake size={19} /> : <Store size={19} />}
                </span>
                <span>
                  <strong>{org.name}</strong>
                  <small>
                    {org.neighborhood} · {number(org.delivered)} entregas
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </PagedItems>
        </div>
        {!filtered.length && (
          <div className={styles.noResults} role="status">
            <Search size={24} />
            <h2>Nenhum ponto encontrado</h2>
            <p>Tente outro nome, bairro ou filtro.</p>
          </div>
        )}
        {selected && <OrganizationCard key={selected.id} org={selected} close={close} />}
      </div>
      <p className={styles.note}>
        Toque em um ponto para conhecer sua participação na rede.
        {missingLocations > 0
          ? ` ${missingLocations} sem coordenadas válidas; consulte na lista.`
          : ""}
      </p>
    </div>
  );
}
