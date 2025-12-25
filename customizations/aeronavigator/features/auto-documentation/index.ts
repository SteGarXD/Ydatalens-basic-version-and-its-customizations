/**
 * Auto Documentation Module
 * Автоматическое документирование дашбордов и метрик
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface Documentation {
  title: string;
  description: string;
  sections: DocumentationSection[];
  generatedAt: Date;
}

export interface DocumentationSection {
  title: string;
  content: string;
  type: 'overview' | 'metrics' | 'insights' | 'recommendations';
}

/**
 * Генерация документации для дашборда
 */
export const generateDashboardDocumentation = async (
  dashboard: {
    id: string;
    name: string;
    widgets: any[];
  },
  data?: any[]
): Promise<Documentation> => {
  if (!AERONAVIGATOR_FEATURES.AUTO_DOCUMENTATION) {
    throw new Error('Auto documentation is disabled');
  }

  const sections: DocumentationSection[] = [];

  // Обзор
  sections.push({
    title: 'Обзор',
    type: 'overview',
    content: `Дашборд "${dashboard.name}" содержит ${dashboard.widgets.length} виджетов для анализа данных.`,
  });

  // Описание метрик
  if (dashboard.widgets.length > 0) {
    const metricsSection: DocumentationSection = {
      title: 'Метрики',
      type: 'metrics',
      content: 'Виджеты дашборда:\n\n',
    };

    dashboard.widgets.forEach((widget, index) => {
      metricsSection.content += `${index + 1}. ${widget.title || widget.type}\n`;
      if (widget.fields) {
        metricsSection.content += `   Поля: ${widget.fields.join(', ')}\n`;
      }
      if (widget.chartType) {
        metricsSection.content += `   Тип графика: ${widget.chartType}\n`;
      }
      metricsSection.content += '\n';
    });

    sections.push(metricsSection);
  }

  // Инсайты (если есть данные)
  if (data && data.length > 0) {
    try {
      const { generateInsights } = await import('../ai-ml/AutoInsights');
      const insights = await generateInsights(data);

      if (insights.insights.length > 0) {
        const insightsSection: DocumentationSection = {
          title: 'Автоматические инсайты',
          type: 'insights',
          content: 'Обнаруженные паттерны и аномалии:\n\n',
        };

        insights.insights.slice(0, 5).forEach(insight => {
          insightsSection.content += `• ${insight.title}: ${insight.description}\n`;
        });

        sections.push(insightsSection);
      }
    } catch (error) {
      console.warn('[AutoDocumentation] Insights generation failed:', error);
    }
  }

  // Рекомендации
  if (data && data.length > 0) {
    try {
      const { generateRecommendations } = await import('../prescriptive-analytics');
      const recommendations = await generateRecommendations(data, {
        domain: 'aviation',
      });

      if (recommendations.length > 0) {
        const recommendationsSection: DocumentationSection = {
          title: 'Рекомендации',
          type: 'recommendations',
          content: 'Рекомендации по улучшению:\n\n',
        };

        recommendations.slice(0, 5).forEach(rec => {
          recommendationsSection.content += `• ${rec.title}: ${rec.action}\n`;
        });

        sections.push(recommendationsSection);
      }
    } catch (error) {
      console.warn('[AutoDocumentation] Recommendations generation failed:', error);
    }
  }

  return {
    title: `Документация: ${dashboard.name}`,
    description: `Автоматически сгенерированная документация для дашборда "${dashboard.name}"`,
    sections,
    generatedAt: new Date(),
  };
};

/**
 * Экспорт документации в Markdown
 */
export const exportToMarkdown = (doc: Documentation): string => {
  let markdown = `# ${doc.title}\n\n`;
  markdown += `${doc.description}\n\n`;
  markdown += `*Сгенерировано: ${doc.generatedAt.toLocaleString('ru-RU')}*\n\n`;

  doc.sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    markdown += `${section.content}\n\n`;
  });

  return markdown;
};

/**
 * Экспорт документации в HTML
 */
export const exportToHTML = (doc: Documentation): string => {
  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a73e8; }
    h2 { color: #34a853; margin-top: 30px; }
    .meta { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <p class="meta">${doc.description}</p>
  <p class="meta">Сгенерировано: ${doc.generatedAt.toLocaleString('ru-RU')}</p>
`;

  doc.sections.forEach(section => {
    html += `  <h2>${section.title}</h2>\n`;
    html += `  <div>${section.content.replace(/\n/g, '<br>')}</div>\n`;
  });

  html += `</body>
</html>`;

  return html;
};

/**
 * Скачивание документации
 */
export const downloadDocumentation = (
  doc: Documentation,
  format: 'markdown' | 'html' = 'markdown'
): void => {
  const content = format === 'markdown' ? exportToMarkdown(doc) : exportToHTML(doc);
  const extension = format === 'markdown' ? 'md' : 'html';
  const mimeType = format === 'markdown' ? 'text/markdown' : 'text/html';
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Инициализация Auto Documentation
 */
export const initializeAutoDocumentation = async () => {
  if (!AERONAVIGATOR_FEATURES.AUTO_DOCUMENTATION) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.documentation) {
        datalens.documentation = {
          generate: generateDashboardDocumentation,
          exportMarkdown: exportToMarkdown,
          exportHTML: exportToHTML,
          download: downloadDocumentation,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Auto Documentation initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Auto Documentation:', error);
  }
};

export default initializeAutoDocumentation;

