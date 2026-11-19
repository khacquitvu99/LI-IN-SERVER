// import React from "react";

interface PictureFrameProps {
  designImg?: string;
  statusImg?: string;
  stoneDiagramImg?: string;
}

export default function PictureFrame({
  designImg = "",
  statusImg = "",
  stoneDiagramImg = "",
}: PictureFrameProps) {
  return (
    <div className="space-y-6 w-full mx-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
      {/* Khối 2 ảnh thiết kế & trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ảnh thiết kế */}
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
          <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Design Image
          </h5>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-200/60 border border-gray-200 flex items-center justify-center text-gray-400">
            {designImg ? (
              <img
                src={designImg}
                alt="Design Image"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs italic">No design image available</span>
            )}
          </div>
        </div>

        {/* Ảnh trạng thái */}
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
          <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Status Image
          </h5>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-200/60 border border-gray-200 flex items-center justify-center text-gray-400">
            {statusImg ? (
              <img
                src={statusImg}
                alt="Status Image"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs italic">No status image available</span>
            )}
          </div>
        </div>
      </div>

      {/* Khối sơ đồ vị trí các loại đá */}
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
        <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Gem Position Diagram
        </h5>
        <div className="relative min-h-55 w-full h-125 overflow-hidden rounded-md bg-gray-200/60 border border-gray-200 flex items-center justify-center text-gray-400">
          {stoneDiagramImg ? (
            <img
              src={stoneDiagramImg}
              alt="Gem Position Diagram"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs italic">No gem position diagram available</span>
          )}
        </div>
      </div>
    </div>
  );
}