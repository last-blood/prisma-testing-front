import EditProjectPage from "@/components/project/EditProjectPage";
import ReduxProvider from "@/components/ReduxProvider";

function page() {
  return (
    <div>
      <ReduxProvider>
        <EditProjectPage />
      </ReduxProvider>
    </div>
  );
}
export default page;
