import { formatNaira } from '../format';

export default function TxList({ items, empty = 'No transactions yet.' }) {
  if (!items.length) return <p className="muted">{empty}</p>;

  return (
    <>
      {items.map((x) => {
        const credit = x.amount > 0;
        return (
          <div className="tx" key={x.id}>
            <div className="ic">{credit ? '⬇️' : '⬆️'}</div>
            <div className="m">
              <b>{x.title}</b>
              <small>
                {x.sub}
                {x.sub && x.date ? ' · ' : ''}
                {x.date}
              </small>
            </div>
            <span className={credit ? 'cr' : 'dr'}>
              {credit ? '+' : '−'}
              {formatNaira(Math.abs(x.amount))}
            </span>
          </div>
        );
      })}
    </>
  );
}
