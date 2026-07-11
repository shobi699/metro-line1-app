import { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IngestForm } from '@/features/knowledge/components/ingest-form'
import { MergeQueue } from '@/features/knowledge/components/merge-queue'
import { GlobalQuery } from '@/features/knowledge/components/global-query'
import { AuditLogs } from '@/features/knowledge/components/audit-logs'
import { Brain, FileUp, Network, Link, Search, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'مدیریت موتور دانش (GraphRAG)',
}

export default function KnowledgeAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          مدیریت موتور دانش و گراف
        </h1>
        <p className="text-muted-foreground mt-2">
          در این پنل می‌توانید اسناد و بخشنامه‌ها را استخراج کرده و پایگاه دانش گراف و برداری (Hybrid RAG) را مدیریت کنید.
        </p>
      </div>

      <Tabs defaultValue="ingest" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-[900px]">
          <TabsTrigger value="ingest" className="gap-2"><FileUp className="h-4 w-4" /> ورود سند</TabsTrigger>
          <TabsTrigger value="queue" className="gap-2"><Link className="h-4 w-4" /> صف تایید هویت</TabsTrigger>
          <TabsTrigger value="global" className="gap-2"><Search className="h-4 w-4" /> خلاصه‌سازی کلان</TabsTrigger>
          <TabsTrigger value="explorer" className="gap-2"><Network className="h-4 w-4" /> کاوشگر گراف</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><Shield className="h-4 w-4" /> لاگ‌های سیستم</TabsTrigger>
        </TabsList>

        <TabsContent value="ingest" className="mt-6">
          <div className="max-w-3xl">
            <IngestForm />
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <div className="max-w-4xl">
            <MergeQueue />
          </div>
        </TabsContent>

        <TabsContent value="global" className="mt-6">
          <div className="max-w-4xl">
            <GlobalQuery />
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <div className="max-w-4xl">
            <AuditLogs />
          </div>
        </TabsContent>

        <TabsContent value="explorer" className="mt-6">
          <div className="flex flex-col items-center justify-center p-12 border rounded-md border-dashed bg-muted/50 text-center">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">کاوشگر گراف (در دست توسعه)</h3>
            <p className="text-muted-foreground mt-2 max-w-[400px]">
              در این بخش نمای بصری (Visual) گراف دانش نمایش داده خواهد شد تا مدیر بتواند ساختار را بررسی کند.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
