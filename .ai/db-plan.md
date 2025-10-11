# Finalny schemat bazy danych PostgreSQL dla projektu 10x-cards

## 1. Tabele

### Typy niest standardowe

Najpierw definiujemy niest standardowy typ ENUM, aby rozróżnić źródło pochodzenia fiszki.

```sql
CREATE TYPE flashcard_source AS ENUM ('manual', 'ai_generated');
```

### Tabela: `flashcards`

Przechowuje fiszki stworzone przez użytkowników.

| Nazwa kolumny | Typ danych                  | Ograniczenia                                                                                                | Opis                                                                 |
|---------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `id`            | `uuid`                      | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                                                  | Unikalny identyfikator fiszki.                                       |
| `user_id`       | `uuid`                      | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                                                   | Identyfikator użytkownika (z tabeli `auth.users` Supabase).          |
| `front`         | `text`                      | `NOT NULL`, `CHECK (length(front) > 0 AND length(front) <= 1000)`                                           | Treść przedniej strony fiszki.                                       |
| `back`          | `text`                      | `NOT NULL`, `CHECK (length(back) > 0 AND length(back) <= 1000)`                                            | Treść tylnej strony fiszki.                                          |
| `source`        | `flashcard_source`          | `NOT NULL`                                                                                                  | Źródło fiszki (`manual` lub `ai_generated`).                         |
| `created_at`    | `timestamp with time zone`  | `NOT NULL`, `DEFAULT now()`                                                                                 | Znacznik czasowy utworzenia fiszki.                                  |
| `updated_at`    | `timestamp with time zone`  | `NOT NULL`, `DEFAULT now()`                                                                                 | Znacznik czasowy ostatniej modyfikacji fiszki.                       |

### Tabela: `study_progress`

Przechowuje metadane dotyczące postępów w nauce dla każdej fiszki, potrzebne dla algorytmu powtórek (np. SM-2).

| Nazwa kolumny        | Typ danych                  | Ograniczenia                                                                                                | Opis                                                                 |
|----------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `flashcard_id`       | `uuid`                      | `PRIMARY KEY`, `REFERENCES flashcards(id) ON DELETE CASCADE`                                                | Identyfikator fiszki, z którą powiązany jest postęp.                 |
| `ease_factor`        | `real`                      | `NOT NULL`, `DEFAULT 2.5`                                                                                   | Współczynnik łatwości (E-Factor) dla algorytmu SM-2.                 |
| `interval`           | `integer`                   | `NOT NULL`, `DEFAULT 0`                                                                                     | Liczba dni do następnej powtórki.                                    |
| `repetitions`        | `integer`                   | `NOT NULL`, `DEFAULT 0`                                                                                     | Liczba pomyślnych powtórek z rzędu.                                  |
| `next_review_date`   | `timestamp with time zone`  | `NOT NULL`, `DEFAULT now()`                                                                                 | Data następnej zaplanowanej powtórki.                                |

## 2. Relacje między tabelami

- **`auth.users` do `flashcards` (jeden-do-wielu)**: Jeden użytkownik może mieć wiele fiszek. Relacja jest zaimplementowana przez klucz obcy `user_id` w tabeli `flashcards`.
- **`flashcards` do `study_progress` (jeden-do-jednego)**: Każda fiszka ma dokładnie jeden wpis dotyczący postępu w nauce. Relacja jest zaimplementowana przez klucz obcy `flashcard_id` w tabeli `study_progress`, który jest jednocześnie jej kluczem głównym.

## 3. Indeksy

Indeksy są tworzone w celu poprawy wydajności zapytań.

- **Indeks na `flashcards(user_id)`**: Przyspiesza wyszukiwanie wszystkich fiszek należących do danego użytkownika.
  ```sql
  CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
  ```
- **Indeks na `study_progress(next_review_date)`**: Przyspiesza wyszukiwanie fiszek, które są gotowe do powtórki w danym dniu.
  ```sql
  CREATE INDEX idx_study_progress_next_review_date ON study_progress(next_review_date);
  ```

## 4. Zasady PostgreSQL (Row-Level Security)

Aby zapewnić, że użytkownicy mogą uzyskać dostęp tylko do swoich własnych danych, zostaną włączone zasady RLS dla tabeli `flashcards` i `study_progress`.

```sql
-- Włączenie RLS dla tabel
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;

-- Zasada dla tabeli flashcards
CREATE POLICY "Użytkownicy mogą zarządzać tylko swoimi fiszkami" 
ON flashcards FOR ALL
USING (auth.uid() = user_id);

-- Zasada dla tabeli study_progress
CREATE POLICY "Użytkownicy mogą zarządzać tylko postępami swoich fiszek" 
ON study_progress FOR ALL
USING (auth.uid() = (SELECT user_id FROM flashcards WHERE id = flashcard_id));
```

## 5. Dodatkowe uwagi

- **Automatyczna aktualizacja `updated_at`**: Aby kolumna `updated_at` była automatycznie aktualizowana przy każdej modyfikacji rekordu, można użyć poniższej funkcji i triggera.
  ```sql
  CREATE OR REPLACE FUNCTION handle_updated_at() 
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_flashcards_update
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();
  ```
- **Zgodność z RODO**: Użycie `ON DELETE CASCADE` w kluczach obcych zapewnia, że po usunięciu użytkownika z `auth.users`, wszystkie jego fiszki (`flashcards`) oraz powiązane z nimi postępy w nauce (`study_progress`) zostaną automatycznie usunięte, co jest zgodne z prawem do bycia zapomnianym.