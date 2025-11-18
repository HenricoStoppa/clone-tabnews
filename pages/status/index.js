import useSWR from "swr";

async function fecthAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>STATUS</h1>
      <UpdatedAt />
      <DBInformation />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fecthAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-br");
  }

  return <div>Última Atulização: {updatedAtText}</div>;
}

function DBInformation() {
  const { isLoading, data } = useSWR("/api/v1/status", fecthAPI, {
    refreshInterval: 2000,
  });

  let dbInfosContent = "Carregando Informações...";

  if (!isLoading && data) {
    dbInfosContent = (
      <ul>
        <li>Versão: {data.dependencies.database.version}</li>
        <li>Conexões Máximas: {data.dependencies.database.max_connections}</li>
        <li>
          Conexões Abertas: {data.dependencies.database.opened_connections}
        </li>
      </ul>
    );
  }

  return (
    <div>
      <h2>INFORMAÇÕES DO BANCO DE DADOS:</h2>
      {dbInfosContent}
    </div>
  );
}
