import LikedProjects from "@/components/project/LikedProjects";
import ReduxProvider from "@/components/ReduxProvider";

function page() {
  return (
    <div>
      <ReduxProvider>
        <LikedProjects />
      </ReduxProvider>
    </div>
  );
}
export default page;
