import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Dictionary } from "@/i18n/messages";

export function Faq({ dict }: { dict: Dictionary }) {
  const m = dict.marketing.faq;

  return (
    <section id="faq" className="bg-white py-20 lg:py-24">
      <div className="container-marketing max-w-3xl">
        <h2 className="font-display text-3xl font-semibold text-ocean sm:text-4xl">{m.title}</h2>
        <Accordion type="single" collapsible className="mt-8">
          {m.items.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`}>
              <AccordionTrigger className="font-display text-left text-base font-semibold text-ocean">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-navy-600">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
