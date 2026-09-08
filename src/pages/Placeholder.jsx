import PageTopbar from '../components/PageTopbar'

export default function Placeholder({ title, description }) {
  return (
    <>
      <PageTopbar title={title} description={description} />
      <div className="p-8">
        <div className="bg-surface border border-border-default rounded-lg shadow-1 p-8 text-sm text-text-secondary">
          Pantalla pendiente de migración. La base (layout, auth, rutas y
          conexión a Supabase) ya está lista.
        </div>
      </div>
    </>
  )
}
