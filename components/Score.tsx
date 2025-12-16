// components/Score.tsx

export default function Score({ actuel, total }: { actuel: number; total: number }) {
  return (
    <div className="text-center text-lg font-bold mt-4">
      Score : {actuel} / {total}
    </div>
  );
}