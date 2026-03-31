interface CodeSnippetProps {
  code: string;
  dark?: boolean;
}

export function CodeSnippet({ code, dark = false }: CodeSnippetProps) {
  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <pre className={`text-xs sm:text-sm font-mono rounded-lg px-4 py-3 overflow-x-auto leading-relaxed ${
        dark
          ? 'text-gray-300 bg-white/10 border border-white/10'
          : 'text-gray-700 bg-gray-900/5 border border-gray-200'
      }`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
