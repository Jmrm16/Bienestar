import { useForm, usePage, Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeftIcon } from 'lucide-react'

interface Asistencia {
  id: number
  nombres_del_estudiante: string
  apellidos_del_estudiante: string
  identificacion: string
  codigo_estudiantil: string
  programa_academico: string
  sexo: string
  grupo_priorizado: string
  fecha: string
  horas: number
  total_asistencias: number // ✅ Nuevo campo
}

interface Grupo {
  id: number
  nombre: string
}

interface Props {
  asistencias: Asistencia[]
  grupo?: Grupo
  grupos?: Grupo[]
}

export default function Importar() {
  const { asistencias, grupo, grupos } = usePage().props as unknown as Props

  const { data, setData, post, processing } = useForm({
    archivo: null as File | null,
    grupo_id: grupo?.id ?? "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('asistencias.importar'), {
      onSuccess: () => {
        toast.success('✅ Archivo importado correctamente')
        setData('archivo', null)
      },
    })
  }

  return (
    <AppLayout>
      <Head title="Importar Asistencias" />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Regresar
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Importar archivo Excel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!grupo && grupos && (
                <div>
                  <Label htmlFor="grupo_id">Selecciona el grupo</Label>
                  <select
                    className="w-full border px-3 py-2 rounded mt-1"
                    name="grupo_id"
                    value={data.grupo_id}
                    onChange={(e) => setData('grupo_id', e.target.value)}
                    required
                  >
                    <option value="">-- Selecciona un grupo --</option>
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col">
                <Label htmlFor="archivo">Selecciona un archivo</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setData('archivo', e.target.files?.[0] ?? null)}
                  required
                />
              </div>

              <Button type="submit" disabled={processing}>
                {processing ? 'Importando...' : 'Importar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asistencias importadas</CardTitle>
          </CardHeader>
          <CardContent>
            {asistencias.length === 0 ? (
              <p className="text-muted-foreground">No hay registros aún.</p>
            ) : (
              <div className="overflow-auto max-h-[400px] rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Apellido</th>
                      <th className="p-2">ID</th>
                      <th className="p-2">Código</th>
                      <th className="p-2">Programa</th>
                      <th className="p-2">Sexo</th>
                      <th className="p-2">Grupo Priorizado</th>
                      <th className="p-2">Asistencias</th>
                      <th className="p-2">Fecha de registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="p-2">{a.nombres_del_estudiante}</td>
                        <td className="p-2">{a.apellidos_del_estudiante}</td>
                        <td className="p-2">{a.identificacion}</td>
                        <td className="p-2">{a.codigo_estudiantil}</td>
                        <td className="p-2">{a.programa_academico}</td>
                        <td className="p-2">{a.sexo}</td>
                        <td className="p-2">{a.grupo_priorizado}</td>
                        <td className="p-2 font-semibold">{a.total_asistencias}</td>
                        <td className="p-2">{a.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
