export default function RutInput({
  value,
  onChange,
  inputRef,
  disabled,
  error,
  normalized,
  ...props
}) {
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        onChange={onChange}
        {...props}
      />
      {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
      {normalized && !error && value && (
        <p className="mt-2 text-xs font-semibold text-emerald-600">RUT: {normalized}</p>
      )}
    </div>
  )
}
