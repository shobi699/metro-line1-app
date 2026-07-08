import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { DashboardView } from './learning/DashboardView'
import { CourseDetailView } from './learning/CourseDetailView'
import { LessonPlayerView } from './learning/LessonPlayerView'
import { ExamRunnerView } from './learning/ExamRunnerView'
import { useTheme } from '../shared/ThemeProvider'

export function LearningScreen() {
  const { theme } = useTheme()
  const [viewState, setViewState] = useState<
    | { name: 'dashboard' }
    | { name: 'course'; courseId: string }
    | { name: 'lesson'; courseId: string; lessonId: string; courseData: any }
    | { name: 'exam'; examId: string }
  >({ name: 'dashboard' })

  const renderContent = () => {
    switch (viewState.name) {
      case 'dashboard':
        return (
          <DashboardView 
            onSelectCourse={(courseId) => setViewState({ name: 'course', courseId })}
          />
        )
      case 'course':
        return (
          <CourseDetailView 
            courseId={viewState.courseId}
            onBack={() => setViewState({ name: 'dashboard' })}
            onSelectLesson={(lessonId, course) => {
              setViewState({ name: 'lesson', courseId: viewState.courseId, lessonId, courseData: course })
            }}
            onStartExam={(examId) => setViewState({ name: 'exam', examId })}
          />
        )
      case 'lesson':
        return (
          <LessonPlayerView 
            course={viewState.courseData} // It won't work perfectly since courseData is null
            lessonId={viewState.lessonId}
            onBack={() => setViewState({ name: 'course', courseId: viewState.courseId })}
          />
        )
      case 'exam':
        return (
          <ExamRunnerView 
            examId={viewState.examId}
            onBack={() => setViewState({ name: 'dashboard' })}
          />
        )
      default:
        return null
    }
  }

  return (
    <ScreenWrapper title="آموزش">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderContent()}
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
