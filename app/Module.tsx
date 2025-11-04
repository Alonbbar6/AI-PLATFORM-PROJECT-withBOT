import * as gtag from "./gtag";

interface ModuleProps {
  moduleId: string;
}

export default function Module({ moduleId }: ModuleProps) {

  const startModule = () => {
    gtag.event({ action: "module_start", params: { module_name: moduleId } });
  };

  const completeModule = () => {
    gtag.event({ action: "module_complete", params: { module_name: moduleId } });
  };

  return (
    <div>
      <button onClick={startModule}>Start Module</button>
      <button onClick={completeModule}>Complete Module</button>
    </div>
  );
}
