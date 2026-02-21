import { TopTabBar } from "@/components/ui/TopTabBar";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg dark:bg-zinc-950/80">
        <h1 className="px-4 pt-4 pb-2 text-xl font-bold">Explore</h1>
        <TopTabBar />
      </div>
      {children}
    </div>
  );
}
