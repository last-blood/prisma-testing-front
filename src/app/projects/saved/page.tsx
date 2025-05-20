import SavedProjectsPage from "@/components/project/SavedProjects";
import ReduxProvider from "@/components/ReduxProvider";

function page() {
  return (
    <div>
      <ReduxProvider>
        <SavedProjectsPage />
      </ReduxProvider>
    </div>
  );
}
export default page;
