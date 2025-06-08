def clean_lines(input_path='data.txt', output_path='cleaned_data.txt'):
    with open(input_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    cleaned_lines = []
    for line in lines:
        # Strip newline and split on the first comma
        cleaned_line = line.split('"', 1)[0].strip()
        cleaned_lines.append(cleaned_line + '\n')

    with open(output_path, 'w', encoding='utf-8') as file:
        file.writelines(cleaned_lines)

    print(f"Cleaned lines written to {output_path}")

# Run the function
clean_lines()