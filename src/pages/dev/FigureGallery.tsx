import { allFigures, Figure } from '../../figures/Figure'

/** Every figure keyframe on one page, for checking poses (route: #/dev/figures). */
export default function FigureGallery() {
  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <h1>Figures</h1>
      <div className="fig-gallery">
        {allFigures().flatMap(([id, n]) =>
          Array.from({ length: n }, (_, i) => (
            <div className="cell" key={`${id}-${i}`}>
              <Figure id={id} poseIndex={i} />
              {id} #{i}
            </div>
          )),
        )}
      </div>
    </div>
  )
}
