"use client";

import React from "react";
import projects from "@/data/projects";
import ProjectsCard from "./project/ProjectsCard";

function Projects() {
  const handleDelete = (id: string) => {
    console.log("Deleting project:", id);
  };

  return (
    <section className="  flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectsCard
            key={project.id}
            project={project}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
}

export default Projects;
