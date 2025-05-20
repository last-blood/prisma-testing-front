import ProjectDetailPage from "@/components/project/ProjectDetailPage";
import ReduxProvider from "@/components/ReduxProvider";

function page() {
  return (
    <div>
      <ReduxProvider>
        <ProjectDetailPage />
      </ReduxProvider>
    </div>
  );
}
export default page;
