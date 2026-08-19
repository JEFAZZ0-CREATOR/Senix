"""
Script de entrenamiento (esqueleto) para entrenar un clasificador de signos
Entrada esperada:
- carpeta `data/` con archivos .npz por clase o un CSV con rutas a archivos numpy
- cada muestra: vector plano de 63 valores (21 puntos * 3)

Salida:
- guarda modelo Keras en `models/model.h5`
- instrucciones para convertir a TF.js usando `tensorflowjs_converter`

Uso (ejemplo):
$ python scripts/train.py --data data/ --epochs 20 --out models/model.h5

"""
import argparse
import os
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers


def load_data(folder):
    # Asume subcarpetas por clase con .npy files
    X = []
    y = []
    classes = sorted([d for d in os.listdir(folder) if os.path.isdir(os.path.join(folder,d))])
    class_map = {c:i for i,c in enumerate(classes)}
    for c in classes:
        cdir = os.path.join(folder,c)
        for f in os.listdir(cdir):
            if f.endswith('.npy') or f.endswith('.npz'):
                path = os.path.join(cdir,f)
                try:
                    arr = np.load(path)
                    if isinstance(arr, np.lib.npyio.NpzFile):
                        # primer array dentro
                        arr = arr[list(arr.files)[0]]
                    X.append(arr.reshape(-1))
                    y.append(class_map[c])
                except Exception as e:
                    print('skip', path, e)
    X = np.stack(X)
    y = np.array(y)
    return X, y, classes


def build_model(input_dim, n_classes):
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(n_classes, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--data', required=True)
    p.add_argument('--epochs', type=int, default=20)
    p.add_argument('--out', default='models/model.h5')
    args = p.parse_args()

    X, y, classes = load_data(args.data)
    print('Loaded', X.shape, 'classes', len(classes))
    model = build_model(X.shape[1], len(classes))
    model.fit(X, y, epochs=args.epochs, validation_split=0.1)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    model.save(args.out)
    print('Saved model to', args.out)
    print('Para convertir a TF.js:')
    print('tensorflowjs_converter --input_format=keras', args.out, 'path/to/tfjs_model')

if __name__ == '__main__':
    main()
