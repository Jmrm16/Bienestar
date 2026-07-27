import React, { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Package2,
  Pill,
  Plus,
} from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import type { Patient } from "../types";

type Medication = {
  id: number;
  nombre: string;
  presentacion?: string | null;
  lote?: string | null;
  proveedor?: string | null;
  fecha_entrada: string;
  fecha_vencimiento?: string | null;
  cantidad_inicial: number;
  cantidad_disponible: number;
  unidad: string;
  ubicacion?: string | null;
  observaciones?: string | null;
};

type Delivery = {
  id: number;
  fecha_entrega: string;
  cantidad: number;
  responsable?: string | null;
  destino?: string | null;
  detalle?: string | null;
  medicamento?: {
    id: number;
    nombre: string;
    presentacion?: string | null;
    unidad: string;
  } | null;
  paciente?: {
    id: number;
    nombre: string;
    documento: string;
  } | null;
};

type NursingActivity = {
  id: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  responsable?: string | null;
  observaciones?: string | null;
  paciente?: {
    id: number;
    nombre: string;
    documento: string;
  } | null;
};

type NursingStats = {
  total_medicamentos: number;
  stock_bajo: number;
  proximos_vencer: number;
  entregas_mes: number;
  actividades_mes: number;
};

type Props = {
  areaKey: string;
  inventoryEnabled?: boolean;
  inventory?: Medication[];
  deliveries?: Delivery[];
  activities?: NursingActivity[];
  stats?: NursingStats;
  patients?: Patient[];
};

const today = new Date().toISOString().slice(0, 10);

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const textOrDash = (value?: string | null, fallback = "—") => {
  const text = (value ?? "").trim();
  return text !== "" ? text : fallback;
};

export default function EnfermeriaPanel({
  areaKey,
  inventoryEnabled = false,
  inventory = [],
  deliveries = [],
  activities = [],
  stats,
  patients = [],
}: Props) {
  const safeStats: NursingStats = stats ?? {
    total_medicamentos: 0,
    stock_bajo: 0,
    proximos_vencer: 0,
    entregas_mes: 0,
    actividades_mes: 0,
  };

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const [inventoryForm, setInventoryForm] = useState({
    nombre: "",
    presentacion: "",
    lote: "",
    proveedor: "",
    fecha_entrada: today,
    fecha_vencimiento: "",
    cantidad_inicial: "1",
    unidad: "unidad",
    ubicacion: "",
    observaciones: "",
  });

  const [deliveryForm, setDeliveryForm] = useState({
    medicamento_id: "",
    paciente_id: "none",
    fecha_entrega: today,
    cantidad: "1",
    responsable: "",
    destino: "",
    detalle: "",
  });

  const [activityForm, setActivityForm] = useState({
    paciente_id: "none",
    fecha: today,
    tipo: "",
    descripcion: "",
    responsable: "",
    observaciones: "",
  });

  const inventoryByStock = useMemo(
    () => [...inventory].sort((a, b) => a.cantidad_disponible - b.cantidad_disponible || a.nombre.localeCompare(b.nombre)),
    [inventory],
  );

  const handleInventoryCreate = () => {
    router.post(
      `/salud/${areaKey}/medicamentos`,
      {
        ...inventoryForm,
        cantidad_inicial: Number(inventoryForm.cantidad_inicial),
        fecha_vencimiento: inventoryForm.fecha_vencimiento || null,
        presentacion: inventoryForm.presentacion || null,
        lote: inventoryForm.lote || null,
        proveedor: inventoryForm.proveedor || null,
        ubicacion: inventoryForm.ubicacion || null,
        observaciones: inventoryForm.observaciones || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setInventoryOpen(false);
          setInventoryForm({
            nombre: "",
            presentacion: "",
            lote: "",
            proveedor: "",
            fecha_entrada: today,
            fecha_vencimiento: "",
            cantidad_inicial: "1",
            unidad: "unidad",
            ubicacion: "",
            observaciones: "",
          });
        },
      },
    );
  };

  const handleDeliveryCreate = () => {
    router.post(
      `/salud/${areaKey}/entregas`,
      {
        ...deliveryForm,
        medicamento_id: Number(deliveryForm.medicamento_id),
        paciente_id: deliveryForm.paciente_id === "none" ? null : Number(deliveryForm.paciente_id),
        cantidad: Number(deliveryForm.cantidad),
        responsable: deliveryForm.responsable || null,
        destino: deliveryForm.destino || null,
        detalle: deliveryForm.detalle || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setDeliveryOpen(false);
          setDeliveryForm({
            medicamento_id: "",
            paciente_id: "none",
            fecha_entrega: today,
            cantidad: "1",
            responsable: "",
            destino: "",
            detalle: "",
          });
        },
      },
    );
  };

  const handleActivityCreate = () => {
    router.post(
      `/salud/${areaKey}/actividades`,
      {
        ...activityForm,
        paciente_id: activityForm.paciente_id === "none" ? null : Number(activityForm.paciente_id),
        responsable: activityForm.responsable || null,
        observaciones: activityForm.observaciones || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setActivityOpen(false);
          setActivityForm({
            paciente_id: "none",
            fecha: today,
            tipo: "",
            descripcion: "",
            responsable: "",
            observaciones: "",
          });
        },
      },
    );
  };

  const getStockBadge = (item: Medication) => {
    if (item.cantidad_disponible <= 0) return <Badge variant="destructive">Agotado</Badge>;
    if (item.cantidad_disponible <= 5) return <Badge variant="outline">Stock bajo</Badge>;
    return <Badge variant="secondary">Disponible</Badge>;
  };

  const getExpiryBadge = (value?: string | null) => {
    if (!value) return <Badge variant="outline">Sin vencimiento</Badge>;

    const current = new Date(today);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    const expiry = new Date(`${value}T00:00:00`);

    if (expiry < current) return <Badge variant="destructive">Vencido</Badge>;
    if (expiry <= limit) return <Badge variant="outline">Próximo a vencer</Badge>;
    return <Badge variant="secondary">Vigente</Badge>;
  };

  if (!inventoryEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enfermería</CardTitle>
          <CardDescription>
            El panel de inventario y actividades necesita las tablas nuevas del módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Ejecuta las migraciones del módulo para habilitar inventario de medicamentos, entregas y actividades de enfermería.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Medicamentos"
          value={safeStats.total_medicamentos}
          icon={Pill}
          color="cyan"
          detail="Lotes registrados"
        />
        <MetricCard
          title="Stock bajo"
          value={safeStats.stock_bajo}
          icon={AlertTriangle}
          color="purple"
          detail="Requieren revisión"
        />
        <MetricCard
          title="Próximos a vencer"
          value={safeStats.proximos_vencer}
          icon={CalendarClock}
          color="blue"
          detail="Dentro de 30 días"
        />
        <MetricCard
          title="Entregas del mes"
          value={safeStats.entregas_mes}
          icon={Package2}
          color="green"
          detail="Salidas registradas"
        />
        <MetricCard
          title="Actividades del mes"
          value={safeStats.actividades_mes}
          icon={ClipboardList}
          color="cyan"
          detail="Acciones asistenciales"
        />
      </div>

      <Tabs defaultValue="inventario" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="actividades">Actividades</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Inventario de medicamentos</CardTitle>
                <CardDescription>
                  Controla entradas, vencimientos, stock disponible y ubicación de cada lote.
                </CardDescription>
              </div>
              <Button className="gap-2" onClick={() => setInventoryOpen(true)}>
                <Plus className="h-4 w-4" />
                Registrar medicamento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryByStock.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No hay medicamentos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventoryByStock.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {textOrDash(item.presentacion)} | Lote: {textOrDash(item.lote)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Ubicación: {textOrDash(item.ubicacion)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(item.fecha_entrada)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p>{formatDate(item.fecha_vencimiento)}</p>
                              {getExpiryBadge(item.fecha_vencimiento)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {item.cantidad_disponible} / {item.cantidad_inicial} {item.unidad}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Proveedor: {textOrDash(item.proveedor)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStockBadge(item)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Entregas de medicamentos</CardTitle>
                <CardDescription>
                  Registra cada salida del inventario con cantidad, paciente o destino, y responsable.
                </CardDescription>
              </div>
              <Button className="gap-2" onClick={() => setDeliveryOpen(true)} disabled={inventory.length === 0}>
                <Plus className="h-4 w-4" />
                Registrar entrega
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Responsable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No hay entregas registradas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliveries.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.fecha_entrega)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.medicamento?.nombre ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">
                                {textOrDash(item.medicamento?.presentacion)} | {textOrDash(item.medicamento?.unidad)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p>{item.paciente?.nombre ?? textOrDash(item.destino, "Destino general")}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.paciente?.documento ?? textOrDash(item.detalle, "Sin detalle")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{textOrDash(item.responsable, "No registrado")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividades">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Actividades y procedimientos</CardTitle>
                <CardDescription>
                  Lleva el control de curaciones, controles, tomas, administración y demás acciones de enfermería.
                </CardDescription>
              </div>
              <Button className="gap-2" onClick={() => setActivityOpen(true)}>
                <Plus className="h-4 w-4" />
                Registrar actividad
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No hay actividades registradas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.fecha)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.tipo}</Badge>
                          </TableCell>
                          <TableCell>
                            {item.paciente ? (
                              <div className="space-y-1">
                                <p>{item.paciente.nombre}</p>
                                <p className="text-xs text-muted-foreground">{item.paciente.documento}</p>
                              </div>
                            ) : (
                              "Sin paciente"
                            )}
                          </TableCell>
                          <TableCell>{textOrDash(item.responsable, "No registrado")}</TableCell>
                          <TableCell className="max-w-[320px]">
                            <p className="line-clamp-2">{item.descripcion}</p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar medicamento</DialogTitle>
            <DialogDescription>
              Agrega un lote al inventario de enfermería con fecha de entrada, vencimiento y stock inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={inventoryForm.nombre} onChange={(e) => setInventoryForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Presentación</Label>
              <Input value={inventoryForm.presentacion} onChange={(e) => setInventoryForm((f) => ({ ...f, presentacion: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Lote</Label>
              <Input value={inventoryForm.lote} onChange={(e) => setInventoryForm((f) => ({ ...f, lote: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Input value={inventoryForm.proveedor} onChange={(e) => setInventoryForm((f) => ({ ...f, proveedor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de entrada</Label>
              <Input type="date" value={inventoryForm.fecha_entrada} onChange={(e) => setInventoryForm((f) => ({ ...f, fecha_entrada: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={inventoryForm.fecha_vencimiento} onChange={(e) => setInventoryForm((f) => ({ ...f, fecha_vencimiento: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cantidad inicial</Label>
              <Input type="number" min="1" value={inventoryForm.cantidad_inicial} onChange={(e) => setInventoryForm((f) => ({ ...f, cantidad_inicial: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Input value={inventoryForm.unidad} onChange={(e) => setInventoryForm((f) => ({ ...f, unidad: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ubicación</Label>
              <Input value={inventoryForm.ubicacion} onChange={(e) => setInventoryForm((f) => ({ ...f, ubicacion: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observaciones</Label>
              <Textarea value={inventoryForm.observaciones} onChange={(e) => setInventoryForm((f) => ({ ...f, observaciones: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInventoryOpen(false)}>Cancelar</Button>
            <Button onClick={handleInventoryCreate}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar entrega</DialogTitle>
            <DialogDescription>
              Registra la salida de medicamentos y actualiza el stock disponible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Medicamento</Label>
              <Select value={deliveryForm.medicamento_id} onValueChange={(value) => setDeliveryForm((f) => ({ ...f, medicamento_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un medicamento" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.nombre} · stock {item.cantidad_disponible}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={deliveryForm.paciente_id} onValueChange={(value) => setDeliveryForm((f) => ({ ...f, paciente_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Paciente opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin paciente</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={String(patient.id)}>
                      {patient.nombres} {patient.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de entrega</Label>
              <Input type="date" value={deliveryForm.fecha_entrega} onChange={(e) => setDeliveryForm((f) => ({ ...f, fecha_entrega: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" min="1" value={deliveryForm.cantidad} onChange={(e) => setDeliveryForm((f) => ({ ...f, cantidad: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input value={deliveryForm.responsable} onChange={(e) => setDeliveryForm((f) => ({ ...f, responsable: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Input value={deliveryForm.destino} onChange={(e) => setDeliveryForm((f) => ({ ...f, destino: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Detalle</Label>
              <Textarea value={deliveryForm.detalle} onChange={(e) => setDeliveryForm((f) => ({ ...f, detalle: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryOpen(false)}>Cancelar</Button>
            <Button onClick={handleDeliveryCreate} disabled={!deliveryForm.medicamento_id}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar actividad</DialogTitle>
            <DialogDescription>
              Documenta lo que se hace en enfermería: controles, curaciones, administración, seguimiento y procedimientos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de actividad</Label>
              <Input value={activityForm.tipo} onChange={(e) => setActivityForm((f) => ({ ...f, tipo: e.target.value }))} placeholder="Ej. Curación, control, administración" />
            </div>
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={activityForm.paciente_id} onValueChange={(value) => setActivityForm((f) => ({ ...f, paciente_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Paciente opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin paciente</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={String(patient.id)}>
                      {patient.nombres} {patient.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={activityForm.fecha} onChange={(e) => setActivityForm((f) => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input value={activityForm.responsable} onChange={(e) => setActivityForm((f) => ({ ...f, responsable: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descripción</Label>
              <Textarea value={activityForm.descripcion} onChange={(e) => setActivityForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observaciones</Label>
              <Textarea value={activityForm.observaciones} onChange={(e) => setActivityForm((f) => ({ ...f, observaciones: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityOpen(false)}>Cancelar</Button>
            <Button onClick={handleActivityCreate} disabled={!activityForm.tipo || !activityForm.descripcion}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

