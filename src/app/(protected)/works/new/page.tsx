import { WorkForm } from "@/components/works/work-form";

export default function NewWorkPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Create New Work</h1>
        <p className="mt-1 text-sm text-surface-400">
          Add a new work to your vault
        </p>
      </div>
      <div className="glow-line" />
      <WorkForm />
    </div>
  );
}
