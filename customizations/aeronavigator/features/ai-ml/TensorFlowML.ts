/**
 * TensorFlow.js ML Module
 * Использование TensorFlow.js для более мощных ML моделей в браузере
 * Работает локально, безопасно для РФ
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Обучение простой модели для обнаружения аномалий
 */
export const trainAnomalyDetectionModel = async (data: number[]): Promise<tf.LayersModel | null> => {
  if (!data || data.length < 10) {
    return null;
  }

  try {
    // Нормализуем данные
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    const normalized = data.map(val => (val - mean) / std);
    
    // Создаем простую модель автоэнкодера для обнаружения аномалий
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [1],
          units: 4,
          activation: 'relu',
          name: 'encoder1'
        }),
        tf.layers.dense({
          units: 2,
          activation: 'relu',
          name: 'encoder2'
        }),
        tf.layers.dense({
          units: 4,
          activation: 'relu',
          name: 'decoder1'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear',
          name: 'decoder2'
        })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    // Подготовка данных для обучения
    const xs = tf.tensor2d(normalized.map(val => [val]));
    const ys = tf.tensor2d(normalized.map(val => [val]));

    // Обучение модели
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: Math.min(32, Math.floor(data.length / 4)),
      verbose: 0,
      shuffle: true
    });

    // Очистка
    xs.dispose();
    ys.dispose();

    return model;
  } catch (error) {
    console.error('[TensorFlowML] Error training model:', error);
    return null;
  }
};

/**
 * Обнаружение аномалий с помощью обученной модели
 */
export const detectAnomaliesWithModel = async (
  model: tf.LayersModel,
  data: number[],
  threshold: number = 0.1
): Promise<{ index: number; value: number; error: number; isAnomaly: boolean }[]> => {
  if (!model || !data || data.length === 0) {
    return [];
  }

  try {
    // Нормализуем данные (нужно использовать те же параметры, что и при обучении)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    const normalized = data.map(val => (val - mean) / std);
    const xs = tf.tensor2d(normalized.map(val => [val]));

    // Предсказание
    const predictions = model.predict(xs) as tf.Tensor;
    const predictionsArray = await predictions.array() as number[][];

    // Вычисляем ошибку реконструкции
    const results = normalized.map((val, index) => {
      const predicted = predictionsArray[index][0];
      const error = Math.abs(val - predicted);
      return {
        index,
        value: data[index],
        error,
        isAnomaly: error > threshold
      };
    });

    // Очистка
    xs.dispose();
    predictions.dispose();

    return results;
  } catch (error) {
    console.error('[TensorFlowML] Error detecting anomalies:', error);
    return [];
  }
};

/**
 * Обучение модели для прогнозирования временных рядов
 */
export const trainTimeSeriesModel = async (
  data: number[],
  lookback: number = 10
): Promise<tf.LayersModel | null> => {
  if (!data || data.length < lookback * 2) {
    return null;
  }

  try {
    // Нормализуем данные
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    const normalized = data.map(val => (val - mean) / std);

    // Подготовка данных для обучения (sliding window)
    const xs: number[][] = [];
    const ys: number[] = [];

    for (let i = lookback; i < normalized.length; i++) {
      xs.push(normalized.slice(i - lookback, i));
      ys.push(normalized[i]);
    }

    if (xs.length === 0) {
      return null;
    }

    // Создаем LSTM модель
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          inputShape: [lookback, 1],
          units: 50,
          returnSequences: false,
          name: 'lstm1'
        }),
        tf.layers.dense({
          units: 25,
          activation: 'relu',
          name: 'dense1'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear',
          name: 'output'
        })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    // Подготовка тензоров
    const xsTensor = tf.tensor3d(xs.map(x => x.map(v => [v])));
    const ysTensor = tf.tensor2d(ys.map(y => [y]));

    // Обучение
    await model.fit(xsTensor, ysTensor, {
      epochs: 50,
      batchSize: Math.min(32, Math.floor(xs.length / 4)),
      verbose: 0,
      shuffle: true
    });

    // Очистка
    xsTensor.dispose();
    ysTensor.dispose();

    return model;
  } catch (error) {
    console.error('[TensorFlowML] Error training time series model:', error);
    return null;
  }
};

/**
 * Прогнозирование с помощью обученной модели
 */
export const predictWithModel = async (
  model: tf.LayersModel,
  data: number[],
  steps: number = 1,
  lookback: number = 10
): Promise<number[]> => {
  if (!model || !data || data.length < lookback) {
    return [];
  }

  try {
    // Нормализуем данные
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    );
    
    const normalized = data.map(val => (val - mean) / std);
    const predictions: number[] = [];
    let currentWindow = normalized.slice(-lookback);

    for (let i = 0; i < steps; i++) {
      const input = tf.tensor3d([currentWindow.map(v => [v])]);
      const prediction = model.predict(input) as tf.Tensor;
      const predValue = (await prediction.array() as number[][])[0][0];
      
      predictions.push(predValue * std + mean);
      
      // Обновляем окно
      currentWindow.shift();
      currentWindow.push(predValue);
      
      // Очистка
      input.dispose();
      prediction.dispose();
    }

    return predictions;
  } catch (error) {
    console.error('[TensorFlowML] Error predicting:', error);
    return [];
  }
};

/**
 * Обучение модели кластеризации (K-means упрощенный)
 */
export const trainClusteringModel = async (
  data: number[][],
  k: number = 3
): Promise<{ centroids: number[][]; labels: number[] } | null> => {
  if (!data || data.length < k) {
    return null;
  }

  try {
    // Упрощенный K-means
    const dimensions = data[0].length;
    let centroids: number[][] = [];
    
    // Инициализация центроидов случайными точками
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      centroids.push([...data[randomIndex]]);
    }

    let labels: number[] = new Array(data.length).fill(0);
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
      changed = false;
      const newCentroids: number[][] = centroids.map(() => new Array(dimensions).fill(0));
      const counts = new Array(k).fill(0);

      // Назначение точек к кластерам
      for (let i = 0; i < data.length; i++) {
        let minDist = Infinity;
        let closestCluster = 0;

        for (let j = 0; j < k; j++) {
          const dist = Math.sqrt(
            data[i].reduce((sum, val, idx) => {
              return sum + Math.pow(val - centroids[j][idx], 2);
            }, 0)
          );

          if (dist < minDist) {
            minDist = dist;
            closestCluster = j;
          }
        }

        if (labels[i] !== closestCluster) {
          changed = true;
          labels[i] = closestCluster;
        }

        counts[closestCluster]++;
        for (let d = 0; d < dimensions; d++) {
          newCentroids[closestCluster][d] += data[i][d];
        }
      }

      // Обновление центроидов
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          for (let d = 0; d < dimensions; d++) {
            centroids[j][d] = newCentroids[j][d] / counts[j];
          }
        }
      }

      iterations++;
    }

    return { centroids, labels };
  } catch (error) {
    console.error('[TensorFlowML] Error training clustering model:', error);
    return null;
  }
};

export default {
  trainAnomalyDetectionModel,
  detectAnomaliesWithModel,
  trainTimeSeriesModel,
  predictWithModel,
  trainClusteringModel
};

