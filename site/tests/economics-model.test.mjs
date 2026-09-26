import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEconomics } from '../assets/economics-model.mjs';

const base = {
  areaM2: 400, capex: 100000, fixedAnnual: 50000, harvestedKg: 1000,
  lossPercent: 20, pricePerKg: 200, variablePerKg: 30, years: 3
};

test('сверяет продажный объём, годовой поток, пороги и возврат вложений', () => {
  const result = calculateEconomics(base);
  assert.equal(result.saleableKg, 800);
  assert.equal(result.revenue, 160000);
  assert.equal(result.annualCosts, 80000);
  assert.equal(result.annualCash, 80000);
  assert.equal(result.breakEvenPrice, 100);
  assert.ok(Math.abs(result.breakEvenHarvestKg - 641.025641025641) < 0.001);
  assert.deepEqual(result.cumulative, [
    { year: 1, cash: -20000 }, { year: 2, cash: 60000 }, { year: 3, cash: 140000 }
  ]);
  assert.equal(result.paybackYear, 2);
});

test('при нулевом урожае или полной потере не придумывает цену безубыточности', () => {
  for (const changed of [{ harvestedKg: 0 }, { lossPercent: 100 }]) {
    const result = calculateEconomics({ ...base, ...changed });
    assert.equal(result.saleableKg, 0);
    assert.equal(result.breakEvenPrice, null);
    assert.equal(result.paybackYear, null);
  }
});

test('при отрицательном вкладе килограмма не обещает достижимый порог', () => {
  const result = calculateEconomics({ ...base, lossPercent: 50, pricePerKg: 40 });
  assert.equal(result.contributionPerHarvestedKg, -10);
  assert.equal(result.breakEvenHarvestKg, null);
  assert.equal(result.paybackYear, null);
});

test('отклоняет пустой, отрицательный и чрезмерный ввод, дробный горизонт', () => {
  assert.throws(() => calculateEconomics({ ...base, capex: '' }), /Первоначальные вложения/);
  assert.throws(() => calculateEconomics({ ...base, fixedAnnual: -1 }), /Ежегодные/);
  assert.throws(() => calculateEconomics({ ...base, areaM2: 0 }), /Площадь/);
  assert.throws(() => calculateEconomics({ ...base, lossPercent: 101 }), /потерь/);
  assert.throws(() => calculateEconomics({ ...base, years: 2.5 }), /целое/);
});
