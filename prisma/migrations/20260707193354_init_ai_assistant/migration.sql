-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT,
    "confidence" INTEGER,
    "handbookSection" TEXT,
    "feedback" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromDate" DATETIME NOT NULL,
    "toDate" DATETIME NOT NULL,
    "reason" TEXT,
    "amount" REAL,
    "unit" TEXT,
    "calculatedAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT,
    "modelName" TEXT,
    "requestFormat" TEXT NOT NULL DEFAULT 'openai_compatible',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "timeoutMs" INTEGER NOT NULL DEFAULT 8000,
    "costPer1kTokens" REAL NOT NULL DEFAULT 0,
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "lastFailureAt" DATETIME,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "extraHeaders" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiKnowledgeCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionText" TEXT NOT NULL,
    "questionEmbedding" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "providerUsed" TEXT,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" REAL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personaKey" TEXT,
    "ttlAt" DATETIME,
    "sourceRefs" JSONB
);

-- CreateTable
CREATE TABLE "Train" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainNumber" TEXT NOT NULL,
    "fleetSeries" TEXT,
    "manufacturer" TEXT,
    "wagonCount" INTEGER NOT NULL DEFAULT 7,
    "commissionedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "qrToken" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Wagon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainId" TEXT NOT NULL,
    "wagonCode" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "wagonType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Wagon_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaultCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "FaultCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "defaultPriority" TEXT NOT NULL DEFAULT 'medium',
    "safetyCritical" BOOLEAN NOT NULL DEFAULT false,
    "requiresWagon" BOOLEAN NOT NULL DEFAULT true,
    "operatorGuide" TEXT,
    "keywords" TEXT,
    "aliases" TEXT,
    "embedding" BLOB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FaultCode_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaultCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaultReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "faultNo" INTEGER NOT NULL,
    "trainId" TEXT NOT NULL,
    "wagonId" TEXT,
    "faultCodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "reporterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationNote" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "serviceImpact" TEXT,
    "photoUrls" JSONB,
    "annotations" JSONB,
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "assigneeId" TEXT,
    "repairStartAt" DATETIME,
    "repairEndAt" DATETIME,
    "rootCause" TEXT,
    "actionsTaken" TEXT,
    "partsUsed" JSONB,
    "verifierId" TEXT,
    "verifiedAt" DATETIME,
    "closedAt" DATETIME,
    "deferReason" TEXT,
    "deferUntil" DATETIME,
    "recurrenceOfId" TEXT,
    "slaDueAt" DATETIME,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FaultReport_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_wagonId_fkey" FOREIGN KEY ("wagonId") REFERENCES "Wagon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_faultCodeId_fkey" FOREIGN KEY ("faultCodeId") REFERENCES "FaultCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_recurrenceOfId_fkey" FOREIGN KEY ("recurrenceOfId") REFERENCES "FaultReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaultLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "faultId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "changes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FaultLog_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "FaultReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FaultLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'event',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "location" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" JSONB,
    "reminders" JSONB,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jalaliDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'official',
    "isOffDay" BOOLEAN NOT NULL DEFAULT true,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "hijriBased" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "OrgEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "audience" JSONB NOT NULL,
    "color" TEXT,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CalendarPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "layers" JSONB NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'month',
    "weekStart" TEXT NOT NULL DEFAULT 'saturday',
    "widgetConfig" JSONB,
    "icsToken" TEXT,
    CONSTRAINT "CalendarPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "definition" JSONB NOT NULL,
    "publishedAt" DATETIME,
    "publishedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "activeVersionId" TEXT,
    "allowMobile" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "workflow" JSONB NOT NULL,
    "access" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "publishedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionNo" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "currentStage" TEXT,
    "data" JSONB NOT NULL,
    "targetDate" DATETIME,
    "amount" REAL,
    "slaDueAt" DATETIME,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormSubmission_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FormVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormSubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "stageKey" TEXT NOT NULL,
    "stageTitle" TEXT NOT NULL,
    "assigneeId" TEXT,
    "decision" TEXT,
    "note" TEXT,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "referredTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormApproval_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "note" TEXT,
    "changes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceName" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "smsText" TEXT,
    "link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventKey" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "channels" JSONB NOT NULL,
    "audience" JSONB,
    "smsIfUnseenMinutes" INTEGER,
    "respectQuietHours" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "driver" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "seenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "quietHours" JSONB,
    CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostAck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ackAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device" TEXT,
    "ip" TEXT,
    "location" JSONB,
    "signature" TEXT,
    CONSTRAINT "PostAck_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostAck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SignageScreen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "pairCode" TEXT NOT NULL,
    "playlistId" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME
);

-- CreateTable
CREATE TABLE "SignagePlaylist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "FeedbackCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "assigneeRole" TEXT NOT NULL,
    "routingRules" JSONB,
    "slaHours" JSONB NOT NULL,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "forceAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "formFields" JSONB,
    "whoCanSubmit" JSONB,
    "ideaBoard" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeedbackMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedbackId" TEXT NOT NULL,
    "senderKind" TEXT NOT NULL,
    "senderId" TEXT,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackMessage_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedbackLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedbackId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackLog_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedbackLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdeaVote" (
    "feedbackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("feedbackId", "userId"),
    CONSTRAINT "IdeaVote_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdeaVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "bufferMin" INTEGER NOT NULL DEFAULT 0,
    "hostMode" TEXT NOT NULL DEFAULT 'user',
    "hostRoleKey" TEXT,
    "whoCanBook" JSONB NOT NULL,
    "approval" TEXT NOT NULL DEFAULT 'auto',
    "minNoticeHrs" INTEGER NOT NULL DEFAULT 4,
    "maxPerWeek" INTEGER,
    "needsRoom" BOOLEAN NOT NULL DEFAULT false,
    "fields" JSONB,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerType" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "fromTime" TEXT NOT NULL,
    "toTime" TEXT NOT NULL,
    "typeKeys" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerType" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "fromTime" TEXT,
    "toTime" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MeetingRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "amenities" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "schema" JSONB NOT NULL,
    "audience" JSONB,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" DATETIME,
    "closesAt" DATETIME,
    "remindDays" JSONB,
    "quotaPercent" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Survey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyInvitee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "respondedAt" DATETIME,
    "remindedAt" DATETIME,
    CONSTRAINT "SurveyInvitee_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SurveyInvitee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "userId" TEXT,
    "segment" JSONB,
    "answers" JSONB NOT NULL,
    "durationSec" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visibility" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProfileChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDocument_typeKey_fkey" FOREIGN KEY ("typeKey") REFERENCES "DocumentType" ("key") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requiredFor" JSONB,
    "hasExpiry" BOOLEAN NOT NULL DEFAULT false,
    "remindDays" JSONB,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "number" TEXT,
    "issuedAt" DATETIME,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "device" TEXT,
    "platform" TEXT,
    "ip" TEXT,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatRolePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "roomKind" TEXT NOT NULL,
    "canSend" BOOLEAN NOT NULL DEFAULT true,
    "canAttach" BOOLEAN NOT NULL DEFAULT true,
    "canPin" BOOLEAN NOT NULL DEFAULT false,
    "canUrgent" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuickReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RosterRolePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RadioChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RadioLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'VOICE_NOTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadioLog_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "RadioChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RadioLog_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RadioPhrase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RadioRolePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "channelKey" TEXT NOT NULL,
    "canListen" BOOLEAN NOT NULL DEFAULT true,
    "canTransmit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DirectoryFieldPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PostAudience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostAudience_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "type" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "certValidityMonths" INTEGER NOT NULL DEFAULT 12,
    "passScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CourseVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "prerequisiteId" TEXT,
    "quiz" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseVideo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchedPct" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "quizScore" INTEGER,
    "lastWatchedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "CourseVideo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseAudience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseAudience_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiPersona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "roleKeys" TEXT NOT NULL,
    "knowledgeCats" TEXT NOT NULL,
    "tools" TEXT NOT NULL,
    "economyModel" TEXT,
    "strongModel" TEXT,
    "monthlyTokenCap" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AiKnowledgeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accessRoles" TEXT,
    "fileUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "indexedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AiChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "meta" TEXT,
    CONSTRAINT "AiChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AiKnowledgeSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personaKey" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costEst" REAL NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL,
    "rating" INTEGER,
    "toolUsed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'suggestion',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reply" TEXT,
    "repliedBy" TEXT,
    "repliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "feedbackNo" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "assigneeId" TEXT,
    "assigneeRole" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "formData" JSONB,
    "attachments" JSONB,
    "anonToken" TEXT,
    "slaFirstDue" DATETIME,
    "slaResolveDue" DATETIME,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "satisfaction" INTEGER,
    "closedAt" DATETIME,
    "isPublicIdea" BOOLEAN NOT NULL DEFAULT false,
    "ideaVotesCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FeedbackCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Feedback" ("body", "createdAt", "id", "isAnonymous", "repliedAt", "repliedBy", "reply", "status", "title", "type", "updatedAt", "userId") SELECT "body", "createdAt", "id", "isAnonymous", "repliedAt", "repliedBy", "reply", "status", "title", "type", "updatedAt", "userId" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
CREATE UNIQUE INDEX "Feedback_feedbackNo_key" ON "Feedback"("feedbackNo");
CREATE UNIQUE INDEX "Feedback_anonToken_key" ON "Feedback"("anonToken");
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
CREATE TABLE "new_MeetingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "targetManagerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "typeId" TEXT,
    "hostRoleKey" TEXT,
    "roomId" TEXT,
    "endAt" DATETIME,
    "formData" JSONB,
    "attendees" JSONB,
    "cancelReason" TEXT,
    "rescheduleOf" TEXT,
    "remindersSent" JSONB,
    "outcomeNote" TEXT,
    CONSTRAINT "MeetingRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeetingRequest_targetManagerId_fkey" FOREIGN KEY ("targetManagerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeetingRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MeetingRoom" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MeetingRequest_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "MeetingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MeetingRequest" ("createdAt", "description", "durationMinutes", "id", "note", "requesterId", "reviewedAt", "reviewedBy", "scheduledAt", "status", "targetManagerId", "title", "updatedAt") SELECT "createdAt", "description", "durationMinutes", "id", "note", "requesterId", "reviewedAt", "reviewedBy", "scheduledAt", "status", "targetManagerId", "title", "updatedAt" FROM "MeetingRequest";
DROP TABLE "MeetingRequest";
ALTER TABLE "new_MeetingRequest" RENAME TO "MeetingRequest";
CREATE INDEX "MeetingRequest_requesterId_idx" ON "MeetingRequest"("requesterId");
CREATE INDEX "MeetingRequest_targetManagerId_idx" ON "MeetingRequest"("targetManagerId");
CREATE INDEX "MeetingRequest_status_idx" ON "MeetingRequest"("status");
CREATE TABLE "new_Poll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "audience" JSONB,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "multiSelect" BOOLEAN NOT NULL DEFAULT false,
    "showResults" TEXT NOT NULL DEFAULT 'after_vote',
    "allowChange" BOOLEAN NOT NULL DEFAULT false,
    "surfaces" JSONB,
    CONSTRAINT "Poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Poll" ("createdAt", "createdById", "description", "expiresAt", "id", "isActive", "title", "updatedAt") SELECT "createdAt", "createdById", "description", "expiresAt", "id", "isActive", "title", "updatedAt" FROM "Poll";
DROP TABLE "Poll";
ALTER TABLE "new_Poll" RENAME TO "Poll";
CREATE INDEX "Poll_isActive_idx" ON "Poll"("isActive");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'news',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "coverUrl" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishAt" DATETIME,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "archivedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'news',
    "audience" JSONB,
    "surfaces" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "pinnedUntil" DATETIME,
    "expiresAt" DATETIME,
    "ackRequired" BOOLEAN NOT NULL DEFAULT false,
    "ackDeadline" DATETIME,
    "bannerStyle" JSONB,
    "attachments" JSONB,
    "notifyRuleKey" TEXT,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("archivedAt", "authorId", "body", "category", "coverUrl", "createdAt", "excerpt", "id", "mandatory", "mediaType", "mediaUrl", "nextReviewAt", "publishAt", "published", "reviewedAt", "reviewedById", "slug", "status", "title", "type", "updatedAt") SELECT "archivedAt", "authorId", "body", "category", "coverUrl", "createdAt", "excerpt", "id", "mandatory", "mediaType", "mediaUrl", "nextReviewAt", "publishAt", "published", "reviewedAt", "reviewedById", "slug", "status", "title", "type", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
CREATE INDEX "Post_type_status_idx" ON "Post"("type", "status");
CREATE INDEX "Post_type_published_idx" ON "Post"("type", "published");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_status_idx" ON "Post"("status");
CREATE TABLE "new_ui_themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primaryColor" TEXT NOT NULL DEFAULT '#ae0011',
    "accentColor" TEXT NOT NULL DEFAULT '#575e70',
    "radius" INTEGER NOT NULL DEFAULT 12,
    "fontSize" TEXT NOT NULL DEFAULT 'md',
    "darkModeDefault" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "apiBaseUrl" TEXT NOT NULL DEFAULT 'https://metro.qzz.io',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ui_themes" ("accentColor", "darkModeDefault", "fontSize", "id", "logoUrl", "primaryColor", "radius", "updatedAt") SELECT "accentColor", "darkModeDefault", "fontSize", "id", "logoUrl", "primaryColor", "radius", "updatedAt" FROM "ui_themes";
DROP TABLE "ui_themes";
ALTER TABLE "new_ui_themes" RENAME TO "ui_themes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_fromDate_idx" ON "LeaveRequest"("fromDate");

-- CreateIndex
CREATE INDEX "AiProvider_priority_idx" ON "AiProvider"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "Train_trainNumber_key" ON "Train"("trainNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Train_qrToken_key" ON "Train"("qrToken");

-- CreateIndex
CREATE INDEX "Train_status_idx" ON "Train"("status");

-- CreateIndex
CREATE INDEX "Wagon_trainId_idx" ON "Wagon"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "Wagon_trainId_position_key" ON "Wagon"("trainId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "FaultCategory_code_key" ON "FaultCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FaultCode_code_key" ON "FaultCode"("code");

-- CreateIndex
CREATE INDEX "FaultCode_categoryId_idx" ON "FaultCode"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "FaultReport_faultNo_key" ON "FaultReport"("faultNo");

-- CreateIndex
CREATE INDEX "FaultReport_trainId_status_idx" ON "FaultReport"("trainId", "status");

-- CreateIndex
CREATE INDEX "FaultReport_faultCodeId_idx" ON "FaultReport"("faultCodeId");

-- CreateIndex
CREATE INDEX "FaultReport_status_idx" ON "FaultReport"("status");

-- CreateIndex
CREATE INDEX "FaultReport_occurredAt_idx" ON "FaultReport"("occurredAt");

-- CreateIndex
CREATE INDEX "FaultReport_slaDueAt_idx" ON "FaultReport"("slaDueAt");

-- CreateIndex
CREATE INDEX "FaultLog_faultId_idx" ON "FaultLog"("faultId");

-- CreateIndex
CREATE INDEX "PersonalEvent_userId_startAt_idx" ON "PersonalEvent"("userId", "startAt");

-- CreateIndex
CREATE INDEX "Holiday_jalaliDate_idx" ON "Holiday"("jalaliDate");

-- CreateIndex
CREATE INDEX "OrgEvent_startAt_idx" ON "OrgEvent"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarPreference_userId_key" ON "CalendarPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarPreference_icsToken_key" ON "CalendarPreference"("icsToken");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_key_version_key" ON "Workflow"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_key_key" ON "FormTemplate"("key");

-- CreateIndex
CREATE INDEX "FormTemplate_category_idx" ON "FormTemplate"("category");

-- CreateIndex
CREATE UNIQUE INDEX "FormVersion_templateId_version_key" ON "FormVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FormSubmission_submissionNo_key" ON "FormSubmission"("submissionNo");

-- CreateIndex
CREATE INDEX "FormSubmission_templateId_status_idx" ON "FormSubmission"("templateId", "status");

-- CreateIndex
CREATE INDEX "FormSubmission_submitterId_idx" ON "FormSubmission"("submitterId");

-- CreateIndex
CREATE INDEX "FormSubmission_currentStage_idx" ON "FormSubmission"("currentStage");

-- CreateIndex
CREATE INDEX "FormSubmission_targetDate_idx" ON "FormSubmission"("targetDate");

-- CreateIndex
CREATE INDEX "FormApproval_submissionId_idx" ON "FormApproval"("submissionId");

-- CreateIndex
CREATE INDEX "FormApproval_assigneeId_decision_idx" ON "FormApproval"("assigneeId", "decision");

-- CreateIndex
CREATE INDEX "FormApproval_decidedById_idx" ON "FormApproval"("decidedById");

-- CreateIndex
CREATE INDEX "FormLog_submissionId_idx" ON "FormLog"("submissionId");

-- CreateIndex
CREATE INDEX "FormLog_actorId_idx" ON "FormLog"("actorId");

-- CreateIndex
CREATE INDEX "NotificationDevice_userId_isActive_idx" ON "NotificationDevice"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDevice_driver_token_key" ON "NotificationDevice"("driver", "token");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_eventKey_key" ON "NotificationTemplate"("eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRule_eventKey_key" ON "NotificationRule"("eventKey");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_createdAt_idx" ON "NotificationOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationOutbox_userId_eventKey_idx" ON "NotificationOutbox"("userId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "PostAck_postId_idx" ON "PostAck"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostAck_postId_userId_key" ON "PostAck"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SignageScreen_pairCode_key" ON "SignageScreen"("pairCode");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackCategory_key_key" ON "FeedbackCategory"("key");

-- CreateIndex
CREATE INDEX "FeedbackMessage_feedbackId_idx" ON "FeedbackMessage"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackLog_feedbackId_idx" ON "FeedbackLog"("feedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingType_key_key" ON "MeetingType"("key");

-- CreateIndex
CREATE INDEX "AvailabilityRule_ownerType_ownerKey_idx" ON "AvailabilityRule"("ownerType", "ownerKey");

-- CreateIndex
CREATE INDEX "AvailabilityException_ownerType_ownerKey_date_idx" ON "AvailabilityException"("ownerType", "ownerKey", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_key_key" ON "Survey"("key");

-- CreateIndex
CREATE INDEX "SurveyInvitee_surveyId_respondedAt_idx" ON "SurveyInvitee"("surveyId", "respondedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyInvitee_surveyId_userId_key" ON "SurveyInvitee"("surveyId", "userId");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSection_key_key" ON "ProfileSection"("key");

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_status_idx" ON "ProfileChangeRequest"("status");

-- CreateIndex
CREATE INDEX "ProfileChangeRequest_userId_idx" ON "ProfileChangeRequest"("userId");

-- CreateIndex
CREATE INDEX "UserDocument_userId_typeKey_idx" ON "UserDocument"("userId", "typeKey");

-- CreateIndex
CREATE INDEX "UserDocument_expiresAt_idx" ON "UserDocument"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_key_key" ON "DocumentType"("key");

-- CreateIndex
CREATE INDEX "Credential_userId_idx" ON "Credential"("userId");

-- CreateIndex
CREATE INDEX "Credential_expiresAt_idx" ON "Credential"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_userId_revokedAt_idx" ON "UserSession"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRolePolicy_roleKey_roomKind_key" ON "ChatRolePolicy"("roleKey", "roomKind");

-- CreateIndex
CREATE UNIQUE INDEX "RosterRolePolicy_roleKey_action_key" ON "RosterRolePolicy"("roleKey", "action");

-- CreateIndex
CREATE UNIQUE INDEX "RadioChannel_key_key" ON "RadioChannel"("key");

-- CreateIndex
CREATE INDEX "RadioLog_channelId_createdAt_idx" ON "RadioLog"("channelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RadioRolePolicy_roleKey_channelKey_key" ON "RadioRolePolicy"("roleKey", "channelKey");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryFieldPolicy_roleKey_fieldKey_key" ON "DirectoryFieldPolicy"("roleKey", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "PostAudience_postId_roleKey_key" ON "PostAudience"("postId", "roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "ContentCategory_key_key" ON "ContentCategory"("key");

-- CreateIndex
CREATE INDEX "VideoProgress_userId_idx" ON "VideoProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_videoId_userId_key" ON "VideoProgress"("videoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAudience_courseId_roleKey_key" ON "CourseAudience"("courseId", "roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_serial_key" ON "Certificate"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_courseId_userId_key" ON "Certificate"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiPersona_key_key" ON "AiPersona"("key");

-- CreateIndex
CREATE INDEX "AiInteraction_createdAt_idx" ON "AiInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "AiInteraction_personaKey_layer_idx" ON "AiInteraction"("personaKey", "layer");
