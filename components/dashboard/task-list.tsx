"use client"

import { useState } from "react"
import { type Task, updateTaskStatus } from "@/lib/notion"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface TaskListProps {
  tasks: Task[]
}

export default function TaskList({ tasks: initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    setLoadingTaskId(taskId)

    try {
      const success = await updateTaskStatus(taskId, completed)

      if (success) {
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)))

        toast({
          title: completed ? "タスク完了" : "タスク未完了に戻しました",
          description: "変更が保存されました",
        })
      } else {
        throw new Error("Failed to update task")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "タスクの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoadingTaskId(null)
    }
  }

  if (tasks.length === 0) {
    return <div className="text-center py-8 text-gray-500">現在、タスクはありません</div>
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="mt-1 w-5 h-5 flex items-center justify-center">
            {loadingTaskId === task.id ? (
              <LoadingSpinner size={16} className="text-blue-600" />
            ) : (
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => handleTaskToggle(task.id, checked === true)}
                className="mt-0"
              />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>{task.name}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
