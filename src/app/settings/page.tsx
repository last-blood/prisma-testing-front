import ReduxProvider from "@/components/ReduxProvider";
import SettingsPage from "@/components/settings/SettingsPage";

function page() {
  return (
    <div>
      <ReduxProvider>
        <SettingsPage />
      </ReduxProvider>
    </div>
  );
}
export default page;
