import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  vi: {
    translation: {
      report_title: 'Báo Cáo Tiến Độ Dự Án',
      subtitle: 'Hệ thống theo dõi công việc & Bảng tổng hợp Checklist',
      shortcut_hint: 'Mẹo: Bấm Alt + L để chuyển ngôn ngữ nhanh',
      overview_tab: 'Trang Tổng Hợp',
      project_category: 'Danh Mục Dự Án',
      add_folder_placeholder: '+ Thêm thư mục...',
      add_btn: 'Thêm',
      report_overview_heading: 'Báo Cáo & Tổng Hợp Tiến Độ',
      stat_total_projects: 'Tổng Thư Mục / Dự Án',
      stat_total_tasks: 'Tổng Hạng Mục Task',
      stat_total_checklists: 'Tổng Đầu Việc Checklist',
      stat_overall_progress: 'Tiến Độ Hoàn Thành',
      checklist_table_title: 'Bảng Checklist Chi Tiết Tất Cả Công Việc',
      checklist_table_sub: 'Liệt kê từng mục con cần thực hiện trong toàn bộ các dự án',
      filter_all: 'Tất cả',
      filter_pending: 'Chưa xong',
      filter_completed: 'Đã xong',
      status_label: 'Trạng thái',
      th_checklist_content: 'Nội dung Checklist',
      th_task_category: 'Hạng Mục Task',
      th_project_folder: 'Thư Mục / Dự Án',
      th_action: 'Thao Tác',
      delete_btn: 'Xóa',
      empty_checklist: 'Không có checklist nào phù hợp với bộ lọc.',
      project_list_heading: 'Danh Sách Các Dự Án',
      total_tasks_label: 'Tổng số Tasks',
      completed_label: 'Đã hoàn thành',
      open_kanban: 'Mở Kanban Board →',
      new_task_placeholder: 'Nhập tên công việc mới...',
      add_task_btn: '+ Tạo Task Mới',
      checklist_progress: 'Tiến độ Checklist',
      add_subitem_placeholder: '+ Thêm mục nhỏ...',
      status_todo: 'Cần Làm',
      status_pending: 'Đang Làm',
      status_done: 'Đã Xong',
      empty_task_col: 'Chưa có công việc'
    }
  },
  ja: {
    translation: {
      report_title: 'プロジェクト進捗レポート',
      subtitle: 'タスク追跡システム＆チェックリスト総合',
      shortcut_hint: 'Alt + L キーで言語を素早く切り替えられます',
      overview_tab: 'ダッシュボード',
      project_category: 'プロジェクト一覧',
      add_folder_placeholder: '+ フォルダを追加...',
      add_btn: '追加',
      report_overview_heading: '進捗レポート＆概要',
      stat_total_projects: '総フォルダ／プロジェクト数',
      stat_total_tasks: '総タスク数',
      stat_total_checklists: '総チェックリスト数',
      stat_overall_progress: '全体進捗率',
      checklist_table_title: '全タスクのチェックリスト詳細',
      checklist_table_sub: '全プロジェクトの実施サブタスク一覧',
      filter_all: 'すべて',
      filter_pending: '未完了',
      filter_completed: '完了済み',
      status_label: 'ステータス',
      th_checklist_content: 'チェックリスト内容',
      th_task_category: 'タスク項目',
      th_project_folder: 'フォルダ／プロジェクト',
      th_action: '操作',
      delete_btn: '削除',
      empty_checklist: '該当するチェックリストはありません。',
      project_list_heading: 'プロジェクト一覧',
      total_tasks_label: 'タスク総数',
      completed_label: '完了数',
      open_kanban: 'カンバンボードを開く →',
      new_task_placeholder: '新しいタスクを入力...',
      add_task_btn: '+ 新規タスク作成',
      checklist_progress: '進捗状況',
      add_subitem_placeholder: '+ サブアイテムを追加...',
      status_todo: '未着手',
      status_pending: '進行中',
      status_done: '完了',
      empty_task_col: 'タスクはありません'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
