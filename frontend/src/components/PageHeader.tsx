import { Link } from "react-router-dom";
import { MoveLeft } from "lucide-react";
import agamLogo from "../assets/images/agam_icon.png";

export const PageHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="relative flex items-center gap-x-4 w-full justify-center">
      <Link to="/" className="absolute left-0 h-full items-center flex">
        <MoveLeft size={30} />
      </Link>
      <img src={agamLogo} alt="agam logo" className="w-[50px] h-[50px]" />
      <h1 className="text-3xl font-bold text-center">{title}</h1>
    </div>
  );
};
