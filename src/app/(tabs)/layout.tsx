import TabsLayoutClient from "./TabsLayoutClient";

export const dynamic = "force-dynamic";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TabsLayoutClient>{children}</TabsLayoutClient>;
}
