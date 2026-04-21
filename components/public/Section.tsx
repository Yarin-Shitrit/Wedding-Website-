export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-10 sm:py-16 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-center mb-6 sm:mb-10">
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}
