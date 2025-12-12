import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { PatientData } from '@/types/medical';

type PatientDataFormProps = {
  patientData: PatientData;
  onPatientDataChange: (field: keyof PatientData, value: string) => void;
};

const PatientDataForm = ({ patientData, onPatientDataChange }: PatientDataFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="User" size={20} />
          Данные пациента
        </CardTitle>
        <CardDescription>Заполните все обязательные поля</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="patientName">ФИО пациента <span className="text-red-500">*</span></Label>
            <Input
              id="patientName"
              placeholder="Иванов Иван Иванович"
              value={patientData.name}
              onChange={(e) => onPatientDataChange('name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Пол <span className="text-red-500">*</span></Label>
            <Select
              value={patientData.gender}
              onValueChange={(value) => onPatientDataChange('gender', value)}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Выберите пол" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Мужской</SelectItem>
                <SelectItem value="female">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthDate">Дата рождения <span className="text-red-500">*</span></Label>
            <Input
              id="birthDate"
              type="date"
              value={patientData.birthDate}
              onChange={(e) => onPatientDataChange('birthDate', e.target.value)}
            />
          </div>
          
          {patientData.birthDate && (
            <div className="space-y-2">
              <Label>Возраст</Label>
              <Input
                value={`${patientData.age} лет`}
                disabled
                className="bg-secondary"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="studyDate">Дата исследования</Label>
            <Input
              id="studyDate"
              type="date"
              value={patientData.studyDate}
              onChange={(e) => onPatientDataChange('studyDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ultrasoundDevice">УЗ аппарат</Label>
            <Input
              id="ultrasoundDevice"
              placeholder="Например: GE Voluson E10"
              value={patientData.ultrasoundDevice}
              onChange={(e) => onPatientDataChange('ultrasoundDevice', e.target.value)}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Масса тела (кг)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70"
              value={patientData.weight}
              onChange={(e) => onPatientDataChange('weight', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="height">Рост (см)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              placeholder="175"
              value={patientData.height}
              onChange={(e) => onPatientDataChange('height', e.target.value)}
            />
          </div>
          
          {patientData.weight && patientData.height && patientData.bsa && (
            <div className="space-y-2 md:col-span-2">
              <Label>Площадь поверхности тела (м²)</Label>
              <Input
                value={`${patientData.bsa.toFixed(2)} м² (формула Дюбуа)`}
                disabled
                className="bg-secondary font-medium"
              />
              <p className="text-xs text-muted-foreground">
                Рассчитано автоматически по формуле: √(масса × рост / 3600)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientDataForm;