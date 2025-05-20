import MyProjects from "@/components/project/MyProjects";
import ReduxProvider from "@/components/ReduxProvider";

function page() {
  return (
    <div>
      <ReduxProvider>
        <MyProjects />
      </ReduxProvider>
    </div>
  );
}
export default page;
