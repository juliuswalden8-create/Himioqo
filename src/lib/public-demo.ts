import { DEFAULT_CATEGORY_ORDER } from "@/lib/places";
import type { LocalizedText, Place, PropertyPlaceWithPlace } from "@/lib/types";

export const PUBLIC_DEMO_TOKEN = "qr_solsidan";

const EXAMPLE_WIFI = "EXAMPLE-WIFI";
const EXAMPLE_PASS = "example-pass-000";
const EXAMPLE_EMAIL = "vard@example.com";
const EXAMPLE_PHONE = "000-000 00 00";

function L(sv: string, en: string, es: string): LocalizedText {
  return { sv, en, es };
}

export function isPublicProductDemo(token: string) {
  return token.trim().toLowerCase() === PUBLIC_DEMO_TOKEN;
}

function demoPlace(
  id: string,
  category: Place["category"],
  name: string,
  description: LocalizedText,
): Place {
  return {
    id,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    organizationId: "public_demo",
    category,
    name,
    description,
    sponsored: false,
    monetization: { kind: "none" },
  };
}

const DEMO_PLACES: Place[] = [
  demoPlace(
    "demo_place_lunch",
    "restaurants",
    "Exempelkrogen",
    L(
      "Påhittad restaurang för demon. Inget riktigt ställe.",
      "A made-up restaurant for the demo. Not a real place.",
      "Restaurante inventado para la demo. No es un sitio real.",
    ),
  ),
  demoPlace(
    "demo_place_cafe",
    "cafes",
    "Exempelcafé",
    L(
      "Påhittat café för demon.",
      "A made-up café for the demo.",
      "Café inventado para la demo.",
    ),
  ),
];

function assigned(place: Place, sortOrder: number): PropertyPlaceWithPlace {
  return {
    id: `demo_pp_${place.id}`,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    propertyId: "public_demo_villa_sol",
    placeId: place.id,
    sortOrder,
    enabled: true,
    place,
  };
}

export function getPublicDemoGuide() {
  return {
    property: {
      name: "Villa Sol",
      address: "Exempelvägen 1",
      city: "Exempelstad",
      country: "Sverige",
      lat: 59.2792,
      lng: 18.3074,
    },
    org: {
      name: "Exempelvärd",
      supportEmail: EXAMPLE_EMAIL,
      supportPhone: EXAMPLE_PHONE,
      emergencyPhone: EXAMPLE_PHONE,
    },
    guide: {
      welcome: L(
        "Välkommen till Villa Sol. Det här är ett exempelboende. Inga uppgifter här är riktiga.",
        "Welcome to Villa Sol. This is a sample home. Nothing here is a real code or contact.",
        "Bienvenido a Villa Sol. Esta es una vivienda de ejemplo. Nada de lo que ves es un código o contacto real.",
      ),
      wifiName: EXAMPLE_WIFI,
      wifiPassword: EXAMPLE_PASS,
      checkIn: "16:00",
      checkOut: "11:00",
      houseRules: L(
        "Ingen rökning inomhus. Hundar är välkomna om de inte lämnas ensamma inne. Efter 22.00 ber vi er hålla låg volym mot grannarna. Lämna ytterdörren låst när ni går ut.",
        "No smoking indoors. Dogs are welcome if they are not left alone inside. After 10 pm please keep the volume down for the neighbours. Lock the door when you leave.",
        "Prohibido fumar en el interior. Los perros son bienvenidos si no se quedan solos. Después de las 22:00 bajad el volumen. Cerrad la puerta al salir.",
      ),
      parking: L(
        "Två exempelplatser på uppfarten. Elstolpens kod är DEMO-000 — inte en riktig portkod.",
        "Two sample spaces on the driveway. The charger code is DEMO-000 — not a real door code.",
        "Dos plazas de ejemplo en la entrada. El código del cargador es DEMO-000: no es un código real.",
      ),
      waste: L(
        "Hushållssopor i det grå exempelkärlet vid garaget. Återvinning lämnas vid den markerade stationen i Exempelstad.",
        "Household waste goes in the grey sample bin by the garage. Recycling is at the marked station in Example Town.",
        "La basura doméstica va al contenedor gris de ejemplo junto al garaje. El reciclaje está en la estación marcada de Ciudad Ejemplo.",
      ),
      appliances: [
        {
          id: "demo_ap_ac",
          key: "ac",
          title: L("Luftvärmepump", "Air conditioning", "Aire acondicionado"),
          text: L(
            "Fjärrkontrollen ligger i hallens låda. Välj 21–22 °C. Stäng av innan ni lämnar huset.",
            "The remote is in the hall drawer. Set 21–22 °C. Turn it off before you leave.",
            "El mando está en el cajón del recibidor. Pon 21–22 °C. Apágalo antes de salir.",
          ),
        },
      ],
      importantNumbers: [
        { id: "demo_num_112", label: L("Nödsamtal", "Emergency", "Emergencias"), phone: "112" },
        {
          id: "demo_num_host",
          label: L("Exempelvärd", "Example host", "Anfitrión de ejemplo"),
          phone: EXAMPLE_PHONE,
        },
      ],
      emergency: L(
        "Vid brand, olycka eller annat livshotande: ring 112. Detta är exempeltext för demon.",
        "In a fire, accident or other life-threatening situation call 112. This is sample text for the demo.",
        "En caso de incendio, accidente u otra emergencia: llama al 112. Este es un texto de ejemplo para la demo.",
      ),
      categoryOrder: [...DEFAULT_CATEGORY_ORDER],
    },
    places: DEMO_PLACES.map((place, index) => assigned(place, index)),
  };
}
