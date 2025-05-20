import CreateProject from "@/components/project/CreateProject";
import ReduxProvider from "@/components/ReduxProvider";

function CreateProjectPage() {
  return (
    <section className="min-h-screen p-5 flex flex-col gap-5">
      <h2 className="text-center">Create project</h2>
      <ReduxProvider>
        <CreateProject />
      </ReduxProvider>
    </section>
  );
}

export default CreateProjectPage;
