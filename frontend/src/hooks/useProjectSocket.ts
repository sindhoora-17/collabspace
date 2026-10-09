import { useEffect } from "react";
import { io } from "socket.io-client";

import type { Activity } from "../types/activity";
import type { Task } from "../types/tasks";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;

  author: {
    id: string;
    email: string;
    displayName: string;
  };
};

const socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000", {
  autoConnect: false,
});

type UseProjectSocketOptions = {
  projectId?: string;

  selectedTaskId?: string;

  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onCommentCreated: (comment: Comment) => void;
  onActivityCreated: (activity: Activity) => void;
  onTaskDeleted: (taskId: string) => void;
};

export function useProjectSocket({
  projectId,
  selectedTaskId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onCommentCreated,
  onActivityCreated,
}: UseProjectSocketOptions) {
  useEffect(() => {
    if (!projectId) {
      return;
    }

    socket.auth = {
      token: localStorage.getItem("accessToken"),
    };

    socket.connect();

    socket.emit("joinProject", {
      projectId,
    });

    function handleTaskCreated(task: Task) {
      onTaskCreated(task);
    }

    function handleTaskUpdated(task: Task) {
      onTaskUpdated(task);
    }

    function handleCommentCreated(comment: Comment) {
      if (selectedTaskId && comment.taskId === selectedTaskId) {
        onCommentCreated(comment);
      }
    }

    function handleActivityCreated(activity: Activity) {
      onActivityCreated(activity);
    }

    function handleTaskDeleted(data: { taskId: string }) {
      onTaskDeleted(data.taskId);
    }

    socket.on("taskCreated", handleTaskCreated);

    socket.on("taskUpdated", handleTaskUpdated);

    socket.on("commentCreated", handleCommentCreated);

    socket.on("activityCreated", handleActivityCreated);

    socket.on("taskDeleted", handleTaskDeleted);

    return () => {
      socket.off("taskCreated", handleTaskCreated);

      socket.off("taskUpdated", handleTaskUpdated);

      socket.off("commentCreated", handleCommentCreated);

      socket.off("activityCreated", handleActivityCreated);

      socket.off("taskDeleted", handleTaskDeleted);

      socket.disconnect();
    };
  }, [
    projectId,
    selectedTaskId,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onCommentCreated,
    onActivityCreated,
  ]);
}
