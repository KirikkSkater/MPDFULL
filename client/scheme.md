::: mermaid
classDiagram
  XMLParser --> DModuleFactory : используется в
  DModuleFactory --> ApplicGroup
  DModuleFactory --> TaskDefinition
  DModuleFactory --> MaintPlanning

  ApplicGroup "1" o-- "*" Applic : содержит
  Applic

  MaintPlanning --> TaskDefinition : содержит
  TaskDefinition --> Task
  TaskDefinition --> RqmtSource
  TaskDefinition --> PreliminaryRqmts
  TaskDefinition --> DmRef
  TaskDefinition --> Limit

  PreliminaryRqmts --> ProductionMaintData
  PreliminaryRqmts --> ReqCondGroup
  PreliminaryRqmts --> ReqPersons
  PreliminaryRqmts --> ReqTechInfo

  ProductionMaintData
  ReqCondGroup
  ReqPersons
  ReqTechInfo
  DmRef
  Limit

  ScheduleTableModel --> TaskDefinition : использует для данных
  ScheduleTableModel --> ScheduleTableModel.colMap

  ScheduleView --> ScheduleTableModel : читает model.columns, model.rows
  ScheduleController --> XMLParser : загружает
  ScheduleController --> DModuleFactory : создаёт доменные объекты
  ScheduleController --> ScheduleTableModel
  ScheduleController --> ScheduleView

:::