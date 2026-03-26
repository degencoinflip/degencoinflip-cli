interface CodeSnippetProps {
  code: string;
}

export function CodeSnippet({ code }: CodeSnippetProps) {
  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <pre className="text-xs sm:text-sm font-mono text-white/30 bg-black/5 rounded-lg px-4 py-3 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
