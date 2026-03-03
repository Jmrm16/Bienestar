import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/component/MetricCard";
import {
  Download,
  Plus,
  Search,
  UserCheck,
  Users,
  UserRound,
} from "lucide-react";
import { getAreaStyle } from "./area-styles";
import { ParticipantDialog } from "./ParticipantDialog";
import type { ParticipantFormValues } from "./ParticipantForm";
import {
  getParticipantStateBadgeClass,
  PARTICIPANT_STATES,
} from "./participant-badges";
import { ParticipantsTable } from "./ParticipantsTable";
import type { Carrera, ParticipantStats, SportParticipant } from "./types";

function payloadFromForm(values: ParticipantFormValues) {
  return {
    ...values,
    carrera_id: values.carrera_id === "none" ? null : Number(values.carrera_id),
    fecha_ingreso: values.fecha_ingreso || null,
    telefono: values.telefono || null,
    correo: values.correo || null,
    semestre: values.semestre || null,
    observaciones: values.observaciones || null,
  };
}

export function ParticipantsSection({
  sportKey,
  sportTitle,
  participants,
  carreras,
  stats,
}: {
  sportKey: string;
  sportTitle: string;
  participants: SportParticipant[];
  carreras: Carrera[];
  stats: ParticipantStats;
}) {
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("Todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SportParticipant | null>(null);
  const style = getAreaStyle(sportKey);
  const Icon = style.icon;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return participants
      .filter((participant) => {
        if (!term) return true;

        const fullName = `${participant.nombres} ${participant.apellidos}`.toLowerCase();

        return (
          participant.documento.toLowerCase().includes(term) ||
          fullName.includes(term) ||
          participant.estamento.toLowerCase().includes(term) ||
          participant.estado.toLowerCase().includes(term) ||
          (participant.carrera_nombre ?? "").toLowerCase().includes(term)
        );
      })
      .filter((participant) =>
        stateFilter === "Todos" ? true : participant.estado === stateFilter
      );
  }, [participants, q, stateFilter]);

  const createParticipant = (values: ParticipantFormValues) => {
    router.post(
      `/deportes/${sportKey}/participantes`,
      payloadFromForm(values),
      {
        preserveScroll: true,
        onSuccess: () => {
          setCreateOpen(false);
          setQ("");
        },
      }
    );
  };

  const updateParticipant = (values: ParticipantFormValues) => {
    if (!editing) return;

    router.post(
      `/deportes/${sportKey}/participantes/${editing.id}`,
      {
        _method: "put",
        ...payloadFromForm(values),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setEditing(null);
        },
      }
    );
  };

  const deleteParticipant = (participant: SportParticipant) => {
    const confirmed = window.confirm(
      `Vas a eliminar a ${participant.nombres} ${participant.apellidos} de ${sportTitle}.`
    );

    if (!confirmed) return;

    router.delete(`/deportes/${sportKey}/participantes/${participant.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        if (editing?.id === participant.id) {
          setEditing(null);
        }
      },
    });
  };

  return (
    <Card className={`rounded-3xl border ${style.softCard}`}>
      <CardContent className="space-y-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-2 ${style.softIcon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Participantes</h2>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Gestion por disciplina
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Registra, actualiza y consulta las personas vinculadas a esta
              disciplina para control e informes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className={style.badge}>
              <a href={`/deportes/${sportKey}/participantes/export`}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </a>
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              className={`${style.hero} border-0 hover:opacity-90`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar participante
            </Button>
          </div>
        </div>

        <div className={`rounded-3xl border p-4 ${style.emphasisPanel}`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium">Control e informes</div>
              <p className="text-sm text-muted-foreground">
                Usa esta seccion para consolidar los registros de {sportTitle.toLowerCase()} y exportar reportes cuando lo necesites.
              </p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}>
              Seguimiento activo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard
            title="Registrados"
            value={stats.total}
            icon={Users}
            color="green"
            detail="Personas vinculadas"
          />
          <MetricCard
            title="Activos"
            value={stats.active}
            icon={UserCheck}
            color="blue"
            detail="Participantes vigentes"
          />
          <MetricCard
            title="Estudiantes"
            value={stats.students}
            icon={UserRound}
            color="cyan"
            detail="Estamento estudiantil"
          />
        </div>

        <div className="relative">
          <Search className={`absolute left-3 top-2.5 h-4 w-4 ${style.action}`} />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por documento, nombre, estamento, estado o carrera..."
            className={`pl-9 ${style.emphasisPanel}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className={stateFilter === "Todos" ? style.badge : undefined}
            onClick={() => setStateFilter("Todos")}
          >
            Todos
          </Button>
          {PARTICIPANT_STATES.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setStateFilter(state)}
              className="inline-flex"
            >
              <Badge
                variant="outline"
                className={`${getParticipantStateBadgeClass(state)} ${
                  stateFilter === state ? "ring-2 ring-offset-2" : ""
                }`}
              >
                {state}
              </Badge>
            </button>
          ))}
        </div>

        <ParticipantsTable
          rows={filtered}
          onEdit={setEditing}
          onDelete={deleteParticipant}
          style={style}
        />
      </CardContent>

      <ParticipantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createParticipant}
        carreras={carreras}
        mode="create"
        sportKey={sportKey}
      />

      <ParticipantDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSubmit={updateParticipant}
        carreras={carreras}
        participant={editing}
        mode="edit"
        sportKey={sportKey}
      />
    </Card>
  );
}
