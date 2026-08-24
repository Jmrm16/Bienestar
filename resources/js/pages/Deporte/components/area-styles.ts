import { Compass, Dumbbell, Shield, Target, Trophy, Volleyball, type LucideIcon } from 'lucide-react';

export type AreaStyle = {
    icon: LucideIcon;
};

const AREA_ICONS: Record<string, LucideIcon> = {
    'prestamo-de-implementos-deportivos': Shield,
    voleibol: Volleyball,
    baloncesto: Target,
    futbol: Trophy,
    taekwondo: Dumbbell,
    'futbol-sala': Compass,
};

export function getAreaStyle(areaKey: string): AreaStyle {
    return {
        icon: AREA_ICONS[areaKey] ?? Volleyball,
    };
}
