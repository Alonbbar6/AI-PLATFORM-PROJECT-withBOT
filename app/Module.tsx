import * as gtag from "./gtag";

interface ModuleProps {
  moduleId: string;
}

export default function Module({ moduleId }: ModuleProps) {

  const startModule = () => {
    gtag.event("module_start", { module_name: moduleId });
  };

  const completeModule = () => {
    gtag.event("module_complete", { module_name: moduleId });
  };

  return (
    <div>
      <button onClick={startModule}>Start Module</button>
      <button onClick={completeModule}>Complete Module</button>
    </div>
  );
}
