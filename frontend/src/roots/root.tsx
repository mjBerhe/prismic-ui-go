import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import img from "../assets/images/agam_icon.png";

import { cn } from "../utils/utils";
import { PageContainer } from "../components/PageContainer";
import { Spotlight } from "../components/ui/motion-ui/Spotlight";
import { useHover } from "usehooks-ts";
import { TextEffect } from "../components/ui/motion-ui/text-effect";

type ModuleLink = {
  id: number;
  name: string;
  disabled: boolean;
  href: string;
  description: string;
};

const palmModules: ModuleLink[] = [
  {
    name: "Valuation",
    id: 0,
    disabled: false,
    href: "/valuation",
    description:
      "Run pALM to produce Scenario Based Approach BEL based on selected inputs",
  },
  {
    name: "Liability Analytics",
    id: 1,
    disabled: false,
    href: "/liability-analytics",
    description:
      "Run pALM to produce monthly liability cashflows based on selected inputs",
  },
  {
    name: "Risk Analytics",
    id: 2,
    disabled: false,
    href: "/risk-analytics",
    description:
      "Run pALM to produce full Economic Balance Sheet and BSCR for selected inputs",
  },
  {
    name: "Financial Projection",
    id: 3,
    disabled: true,
    href: "",
    description: "",
  },
  {
    name: "Strategic Asset Allocation",
    id: 4,
    disabled: false,
    href: "/strategic-asset-allocation",
    description:
      "Run pALM to model the impact of PVDE and TAR under different Strategic Asset Allocations",
  },
  {
    name: "New Business Pricing",
    id: 5,
    disabled: true,
    href: "",
    description: "",
  },
];

const palmTools: ModuleLink[] = [
  {
    name: "Generate Inputs",
    id: 6,
    disabled: false,
    href: "/generate-inputs",
    description:
      "Update key assumptions and config settings for pALM runs using client input file",
  },
];

export default function Root() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.getElementsByClassName(
        "card"
      ) as HTMLCollectionOf<HTMLElement>;

      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }
    };

    const cardsContainer = document.getElementById("cards");
    if (cardsContainer) {
      cardsContainer.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (cardsContainer) {
        cardsContainer.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return (
    <PageContainer>
      <div className="flex flex-col w-full items-center h-screen justify-center">
        <div className="flex items-center gap-x-4">
          <img src={img} alt="agam-logo" className="w-[70px] h-[70px]" />
          <h1 className="text-4xl font-bold">pALM</h1>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mt-16">
          {[...palmModules, ...palmTools].map((module) => (
            <ModuleCard module={module} key={module.id} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

const ModuleCard: React.FC<{ module: ModuleLink }> = ({ module }) => {
  const { id, name, href, description, disabled } = module;
  const hoverRef = useRef(null);
  const isHover = useHover(hoverRef);

  return (
    <Link
      to={disabled ? "#" : href}
      className={cn(
        "relative aspect-video h-[180px] overflow-hidden rounded-xl bg-dark-600 p-[1px] cursor-pointer",
        disabled ? "bg-transparent" : ""
      )}
      ref={hoverRef}
    >
      {!disabled && <Spotlight className="to-primary-400 blur-xl" size={175} />}
      <div
        className={cn(
          "relative h-full w-full rounded-xl bg-dark-800 hover:bg-dark-700 p-5",
          disabled ? "cursor-not-allowed opacity-50" : ""
        )}
      >
        <h3 className={cn("text-xl font-bold", isHover ? "text-white" : "text-gray-200")}>
          {name}
        </h3>

        {isHover && (
          <TextEffect
            preset="slide"
            as="p"
            per="line"
            className="text-sm mt-2 text-gray-300"
          >
            {!disabled ? description : "Coming Soon"}
          </TextEffect>
        )}
      </div>
    </Link>
  );
};
