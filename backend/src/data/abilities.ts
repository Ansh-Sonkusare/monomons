// Pokemon Abilities Data
// Abilities with their effects and values

export interface BattleAbility {
    name: string;
    effect: string;
    value: number;
}

export const ABILITIES_LIBRARY: BattleAbility[] = [
    // Starter abilities - boost when low HP
    { name: 'Blaze', effect: 'power_boost_low_hp', value: 1.5 },
    { name: 'Torrent', effect: 'power_boost_low_hp', value: 1.5 },
    { name: 'Overgrow', effect: 'power_boost_low_hp', value: 1.5 },
    { name: 'Swarm', effect: 'power_boost_low_hp', value: 1.5 },
    // Offensive abilities
    { name: 'Adaptability', effect: 'stab_boost', value: 2.0 },
    { name: 'Sniper', effect: 'crit_boost', value: 0.25 },
    { name: 'Super Luck', effect: 'crit_boost', value: 0.25 },
    { name: 'Technician', effect: 'weak_move_boost', value: 1.5 },
    { name: 'Hustle', effect: 'attack_boost_accuracy_drop', value: 1.5 },
    { name: 'Guts', effect: 'attack_boost_status', value: 1.5 },
    { name: 'Moxie', effect: 'attack_on_ko', value: 1.1 },
    { name: 'Rivalry', effect: 'same_gender_boost', value: 1.25 },
    { name: 'Sheer Force', effect: 'move_power_boost', value: 1.3 },
    { name: 'Tough Claws', effect: 'contact_move_boost', value: 1.3 },
    { name: 'Strong Jaw', effect: 'bite_move_boost', value: 1.5 },
    { name: 'Iron Fist', effect: 'punch_move_boost', value: 1.2 },
    { name: 'Reckless', effect: 'recoil_move_boost', value: 1.2 },
    // Defensive abilities
    { name: 'Thick Fat', effect: 'fire_ice_resist', value: 0.5 },
    { name: 'Marvel Scale', effect: 'defense_boost_status', value: 1.5 },
    { name: 'Sturdy', effect: 'survive_one_hit', value: 1 },
    { name: 'Shell Armor', effect: 'crit_immunity', value: 1 },
    { name: 'Battle Armor', effect: 'crit_immunity', value: 1 },
    { name: 'Filter', effect: 'super_effective_reduction', value: 0.75 },
    { name: 'Solid Rock', effect: 'super_effective_reduction', value: 0.75 },
    { name: 'Levitate', effect: 'ground_immunity', value: 1 },
    { name: 'Water Absorb', effect: 'heal_on_water_hit', value: 0.25 },
    { name: 'Volt Absorb', effect: 'heal_on_electric_hit', value: 0.25 },
    { name: 'Flash Fire', effect: 'fire_immunity_boost', value: 1.5 },
    { name: 'Dry Skin', effect: 'water_heal_fire_weak', value: 0.25 },
    { name: 'Storm Drain', effect: 'water_immunity_sp_attack_boost', value: 1 },
    { name: 'Lightning Rod', effect: 'electric_immunity_sp_attack_boost', value: 1 },
    { name: 'Wonder Guard', effect: 'only_super_effective_hits', value: 1 },
    // Speed abilities
    { name: 'Speed Boost', effect: 'speed_per_turn', value: 1.5 },
    { name: 'Swift Swim', effect: 'speed_in_rain', value: 2.0 },
    { name: 'Chlorophyll', effect: 'speed_in_sun', value: 2.0 },
    { name: 'Quick Feet', effect: 'speed_boost_status', value: 1.5 },
    { name: 'Unburden', effect: 'speed_boost_on_item_use', value: 2.0 },
    { name: 'Sand Rush', effect: 'speed_in_sand', value: 2.0 },
    { name: 'Slush Rush', effect: 'speed_in_hail', value: 2.0 },
    // Stat modification abilities
    { name: 'Intimidate', effect: 'enemy_attack_down_on_switch', value: 0.8 },
    { name: 'Defiant', effect: 'attack_boost_when_stats_lowered', value: 2.0 },
    { name: 'Competitive', effect: 'sp_attack_boost_when_stats_lowered', value: 2.0 },
    // Copy/Trace abilities
    { name: 'Trace', effect: 'copy_ability', value: 1 },
    { name: 'Skill Swap', effect: 'swap_abilities', value: 1 },
    { name: 'Role Play', effect: 'copy_ability', value: 1 },
    // Healing/Recovery abilities
    { name: 'Synchronize', effect: 'status_reflect', value: 1 },
    { name: 'Natural Cure', effect: 'heal_on_switch_out', value: 1 },
    { name: 'Regenerator', effect: 'heal_on_switch_out', value: 0.33 },
    { name: 'Poison Heal', effect: 'heal_when_poisoned', value: 0.125 },
    { name: 'Rain Dish', effect: 'heal_in_rain', value: 0.0625 },
    { name: 'Ice Body', effect: 'heal_in_hail', value: 0.0625 },
    // Effect chance abilities
    { name: 'Serene Grace', effect: 'secondary_effect_double', value: 2.0 },
    { name: 'Shield Dust', effect: 'secondary_effect_immunity', value: 1 },
    // Status immunity abilities
    { name: 'Inner Focus', effect: 'flinch_immunity', value: 1 },
    { name: 'Immunity', effect: 'poison_immunity', value: 1 },
    { name: 'Limber', effect: 'paralysis_immunity', value: 1 },
    { name: 'Magma Armor', effect: 'freeze_immunity', value: 1 },
    { name: 'Water Veil', effect: 'burn_immunity', value: 1 },
    { name: 'Insomnia', effect: 'sleep_immunity', value: 1 },
    { name: 'Vital Spirit', effect: 'sleep_immunity', value: 1 },
    { name: 'Own Tempo', effect: 'confusion_immunity', value: 1 },
    // Stat drop immunity abilities
    { name: 'Clear Body', effect: 'stat_drop_immunity', value: 1 },
    { name: 'White Smoke', effect: 'stat_drop_immunity', value: 1 },
    { name: 'Hyper Cutter', effect: 'attack_drop_immunity', value: 1 },
    { name: 'Keen Eye', effect: 'accuracy_drop_immunity', value: 1 },
    { name: 'Big Pecks', effect: 'defense_drop_immunity', value: 1 },
    // Weather abilities
    { name: 'Drought', effect: 'sun_on_switch', value: 1 },
    { name: 'Drizzle', effect: 'rain_on_switch', value: 1 },
    { name: 'Sand Stream', effect: 'sand_on_switch', value: 1 },
    { name: 'Snow Warning', effect: 'hail_on_switch', value: 1 },
    { name: 'Air Lock', effect: 'weather_effects_nullified', value: 1 },
    { name: 'Cloud Nine', effect: 'weather_effects_nullified', value: 1 },
    // Pressure ability
    { name: 'Pressure', effect: 'pp_pressure', value: 1 },
    // Contact effect abilities
    { name: 'Static', effect: 'paralyze_on_contact', value: 0.3 },
    { name: 'Poison Point', effect: 'poison_on_contact', value: 0.3 },
    { name: 'Effect Spore', effect: 'status_on_contact', value: 0.1 },
    { name: 'Flame Body', effect: 'burn_on_contact', value: 0.3 },
    { name: 'Cute Charm', effect: 'infatuate_on_contact', value: 0.3 },
    // Other abilities
    { name: 'Magic Guard', effect: 'no_indirect_damage', value: 1 },
    { name: 'Multiscale', effect: 'half_damage_at_full_hp', value: 0.5 },
    { name: 'Shadow Tag', effect: 'prevent_switching', value: 1 },
    { name: 'Arena Trap', effect: 'prevent_switching', value: 1 },
    { name: 'Magnet Pull', effect: 'trap_steel_types', value: 1 },
    { name: 'Soundproof', effect: 'sound_move_immunity', value: 1 },
    { name: 'Suction Cups', effect: 'prevent_forced_switch', value: 1 },
    { name: 'Stench', effect: 'flinch_chance', value: 0.1 },
    { name: 'Run Away', effect: 'always_escape', value: 1 },
    { name: 'Pickup', effect: 'pickup_items', value: 1 },
    { name: 'Honey Gather', effect: 'gather_honey', value: 1 },
    // Accuracy abilities
    { name: 'Compound Eyes', effect: 'accuracy_boost', value: 1.3 },
    { name: 'Huge Power', effect: 'attack_flat_boost', value: 2.0 },
    { name: 'Pure Power', effect: 'attack_flat_boost', value: 2.0 }
];
