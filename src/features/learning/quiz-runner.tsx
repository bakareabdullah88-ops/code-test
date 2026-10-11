import { useState } from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { useAttemptQuiz, useQuiz } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { RadioGroup } from '@/components/ui/radio-group/radio-group';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Notice } from '@/components/patterns/notice/notice';

type Answers = Record<string, string[] | boolean>;

/** Quiz without penalties: wrong answers explain themselves, and trying again is always allowed. */
export function QuizRunner({ quizId }: { quizId: string }) {
  const t = useT();
  const q = useQuiz(quizId);
  const attempt = useAttemptQuiz();
  const [answers, setAnswers] = useState<Answers>({});
  const results = attempt.data?.results;

  return (
    <QueryState query={q} skeleton={<SkeletonText lines={4} />}>
      {(quiz) => {
        const answered = quiz.questions.every((qq) => (qq.kind === 'true_false' ? typeof answers[qq.id] === 'boolean' : Array.isArray(answers[qq.id]) && (answers[qq.id] as string[]).length > 0));
        const correct = results?.filter((r) => r.correct).length ?? 0;
        return (
          <section aria-labelledby={`quiz-${quizId}`} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 md:p-6">
            <h2 id={`quiz-${quizId}`} className="text-h4 font-semibold">{t('learn.quiz.title')}</h2>
            <ol className="flex flex-col gap-6">
              {quiz.questions.map((qq, i) => {
                const r = results?.find((x) => x.questionId === qq.id);
                return (
                  <li key={qq.id} className="flex flex-col gap-2">
                    <fieldset disabled={!!results} className="flex flex-col gap-1">
                      <legend className="font-medium text-ink">{i + 1}. {qq.prompt}</legend>
                      {qq.kind === 'single' ? (
                        <RadioGroup aria-label={qq.prompt} value={(answers[qq.id] as string[] | undefined)?.[0] ?? ''} onValueChange={(v) => setAnswers((a) => ({ ...a, [qq.id]: [v] }))} options={qq.options.map((o) => ({ value: o.id, label: o.text }))} />
                      ) : qq.kind === 'multi' ? (
                        <div>{qq.options.map((o) => {
                          const cur = (answers[qq.id] as string[] | undefined) ?? [];
                          return <Checkbox key={o.id} label={o.text} checked={cur.includes(o.id)} onCheckedChange={(c) => setAnswers((a) => ({ ...a, [qq.id]: c ? [...cur, o.id] : cur.filter((x) => x !== o.id) }))} />;
                        })}</div>
                      ) : (
                        <RadioGroup aria-label={qq.prompt} value={typeof answers[qq.id] === 'boolean' ? String(answers[qq.id]) : ''} onValueChange={(v) => setAnswers((a) => ({ ...a, [qq.id]: v === 'true' }))} options={[{ value: 'true', label: t('learn.quiz.true') }, { value: 'false', label: t('learn.quiz.false') }]} />
                      )}
                    </fieldset>
                    {r ? (
                      <div className="flex gap-2 rounded-md bg-sunken p-3 text-base" role="status">
                        {r.correct ? <CheckCircle size={22} weight="fill" className="shrink-0 text-success" aria-hidden="true" /> : <Circle size={22} className="shrink-0 text-warning" aria-hidden="true" />}
                        <div><p className="font-medium">{r.correct ? t('learn.quiz.correct') : t('learn.quiz.lookAgain')}</p><p className="text-muted">{r.explanation}</p></div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {results ? (
              <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3 bg-accent-soft">
                <p className="font-medium" role="status">{t('learn.quiz.score', { correct, total: results.length })}</p>
                <Button variant="secondary" onClick={() => { attempt.reset(); setAnswers({}); }}>{t('learn.quiz.retry')}</Button>
              </Card>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button loading={attempt.isPending} disabled={!answered} onClick={() => attempt.mutate({ quizId, answers })}>{t('learn.quiz.check')}</Button>
                {!answered ? <p className="text-sm text-muted">{t('learn.quiz.answerAll')}</p> : null}
              </div>
            )}
            {attempt.isError ? <Notice tone="danger">{t('states.errorBody')}</Notice> : null}
          </section>
        );
      }}
    </QueryState>
  );
}
