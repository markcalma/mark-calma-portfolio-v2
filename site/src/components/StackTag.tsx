interface StackTagProps {
  name: string;
}

export function StackTag({ name }: StackTagProps) {
  return (
    <span className="font-mono text-xs bg-border text-secondary px-2 py-1 rounded">
      {name}
    </span>
  );
}
