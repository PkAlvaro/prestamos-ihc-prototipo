import RutInput from './RutInput'

export default function EstudianteForm({
  estudiante,
  setEstudiante,
  rutInputRef,
  rutReadOnly,
  rutError,
  rutNormalizado,
}) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <RutInput
        value={estudiante.rut}
        inputRef={rutInputRef}
        disabled={rutReadOnly}
        error={rutError}
        normalized={rutNormalizado}
        onChange={e => setEstudiante({ ...estudiante, rut: e.target.value })}
        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-cai-dark"
        placeholder="Ej: 12345678-9"
      />
    </div>
  )
}
