export default function PageTopbar({ title, description, actions }) {
  return (
    <div className="px-8 pt-5 pb-1 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="text-xl font-semibold">{title}</div>
        {description && (
          <div className="text-[13px] text-text-secondary mt-0.5">
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
