import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

/**
 * Fynnox als 3D-Modell.
 *
 * Das Modell stammt aus dem Schwesterprojekt fynnox-adventure
 * (public/models/fynnox.glb, mit Skelett, aber ohne Animationen).
 *
 * WICHTIG: Diese Datei wird nur über einen dynamischen Import geladen.
 * three.js wiegt gebaut mehr als die gesamte übrige App — im Hauptbündel
 * würde es die Ladezeit auf dem Handy vervielfachen. Wer die 3D-Ansicht
 * nicht öffnet, lädt sie nie.
 *
 * Beleuchtet wird von Hand statt über <Stage environment="…">: Die fertigen
 * Umgebungen von drei werden zur Laufzeit aus dem Netz nachgeladen. Das
 * scheitert offline — und die App soll offline laufen.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/fynnox.glb`

function Model() {
  const { scene } = useGLTF(MODEL_URL)
  return <primitive object={scene} />
}

export default function Fynnox3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 3], fov: 40 }}
      // Auf schwachen Geräten reicht die einfache Auflösung völlig.
      dpr={[1, 1.5]}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0a1626']} />

      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight position={[-3, 2, -3]} intensity={0.8} color="#8fd0ff" />

      <Suspense fallback={null}>
        {/* Bounds rückt die Kamera so, dass das Modell ganz im Bild ist —
            egal wie groß es im GLB angelegt wurde. */}
        <Bounds fit clip observe margin={1.15}>
          <Center>
            <Model />
          </Center>
        </Bounds>
      </Suspense>

      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.5}
        minPolarAngle={0.6}
        maxPolarAngle={Math.PI / 1.9}
      />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
